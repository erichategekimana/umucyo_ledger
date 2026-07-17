"""
USSD Gateway Domain Views (`*789#` Africa's Talking Protocol Handler).

Implements:
- FR 1.0 (Menu Navigation Engine)
- FR 1.1 (Bilingual Kinyarwanda/English Session Flow)
- FR 1.2 (Real-Time & Historical Balance Queries)
- NFR 6 (Sub-20-Second Gateway Execution Limit to prevent telco session termination)
"""
import logging
import time
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from apps.cooperatives.models import Farmer

logger = logging.getLogger("umucyo.audit")


@csrf_exempt
@require_POST
def ussd_callback(request):
    """
    Africa's Talking / Telecom USSD Gateway Callback Endpoint (`POST /ussd/callback/`).

    Receives standard `sessionId`, `phoneNumber`, and `text` payload parameters.
    Enforces strict protocol prefix responses:
    - `CON ...` keeps the interactive USSD session alive.
    - `END ...` terminates the session with final payload output.
    """
    start_time = time.time()

    session_id = request.POST.get("sessionId", "")
    phone_number = request.POST.get("phoneNumber", "").strip()
    text = request.POST.get("text", "").strip()

    logger.info(f"USSD_REQ | session='{session_id}' | phone='{phone_number}' | text='{text}'")

    # Lookup farmer by registered phone number
    try:
        farmer = Farmer.objects.select_related("cooperative", "user").get(phone_number=phone_number)
    except Farmer.DoesNotExist:
        # If unregistered, return END immediately
        response_text = (
            "END Muraho! Nimero yanyu ntabwo yanditswe muri Umucyo Ledger.\n"
            "Mwegere Koperative yanyu cyangwa Umukozi ubashinzwe kugira ngo biyandikishe."
        )
        return _format_ussd_response(response_text, start_time)

    # Determine user language preference (FR 1.1 / NFR 5)
    preferred_lang = getattr(farmer.user, "preferred_language", "rw") if farmer.user else "rw"

    # Split menu text steps (e.g. "1*2")
    parts = text.split("*") if text else []
    level = len(parts)

    if text == "" or level == 0:
        # Root Menu
        if preferred_lang == "en":
            response_text = (
                f"CON Welcome to Umucyo Ledger ({farmer.cooperative.name})\n"
                "1. Check Recent Deliveries\n"
                "2. Check Season Balance\n"
                "3. Check Market Prices\n"
                "4. Switch to Kinyarwanda"
            )
        else:
            response_text = (
                f"CON Murakaza neza kuri Umucyo Ledger ({farmer.cooperative.name})\n"
                "1. Reba ibyo wagemuye biheruka\n"
                "2. Reba umusaruro wose w'igihembwe\n"
                "3. Reba ibiciro ku isoko\n"
                "4. Hindura mu Cyongereza (English)"
            )
        return _format_ussd_response(response_text, start_time)

    root_choice = parts[0]

    # Option 1: Recent Deliveries (FR 1.2)
    if root_choice == "1":
        last_deliveries = farmer.deliveries.order_by("-dropoff_time")[:3]
        if not last_deliveries:
            msg = (
                "END You have no recorded deliveries yet this season."
                if preferred_lang == "en"
                else "END Nta musaruro urandikwa ku izina ryanyu muri iki gihembwe."
            )
            return _format_ussd_response(msg, start_time)

        if preferred_lang == "en":
            lines = [f"{d.dropoff_time.strftime('%d/%m')} - {float(d.weight_kg)}kg ({d.crop_type})" for d in last_deliveries]
            msg = "END Your recent deliveries:\n" + "\n".join(lines)
        else:
            lines = [f"{d.dropoff_time.strftime('%d/%m')} - {float(d.weight_kg)}kg ({d.crop_type})" for d in last_deliveries]
            msg = "END Ibyo wagemuye biheruka:\n" + "\n".join(lines)
        return _format_ussd_response(msg, start_time)

    # Option 2: Season Balance (FR 1.2)
    elif root_choice == "2":
        total_kg = float(farmer.total_season_kg or 0)
        if preferred_lang == "en":
            msg = f"END Season Balance:\nTotal weight delivered: {total_kg} kg across all verified batches."
        else:
            msg = f"END Umusaruro w'Igihembwe:\nYose hamwe wagemuye: {total_kg} kg muri Koperative."
        return _format_ussd_response(msg, start_time)

    # Option 3: Market Prices
    elif root_choice == "3":
        if preferred_lang == "en":
            msg = (
                "END Current Indicative Market Prices:\n"
                "- Soya: 850 RWF/kg\n"
                "- Coffee (Cherry): 410 RWF/kg\n"
                "- Maize: 320 RWF/kg"
            )
        else:
            msg = (
                "END Ibiciro by'ibihingwa ku isoko:\n"
                "- Soya: 850 RWF/kg\n"
                "- Ikawa: 410 RWF/kg\n"
                "- Ibishyimbo/kigori: 320 RWF/kg"
            )
        return _format_ussd_response(msg, start_time)

    # Option 4: Language Switch
    elif root_choice == "4":
        if farmer.user:
            new_lang = "en" if preferred_lang == "rw" else "rw"
            farmer.user.preferred_language = new_lang
            farmer.user.save(update_fields=["preferred_language", "updated_at"])
            msg = "END Language switched to English." if new_lang == "en" else "END Ururimi rwahinduwe mu Kinyarwanda."
        else:
            msg = "END Language preference updated." if preferred_lang == "en" else "END Ururimi rwahinduwe."
        return _format_ussd_response(msg, start_time)

    # Unknown Option
    else:
        msg = "END Invalid choice. Please dial *789# again." if preferred_lang == "en" else "END Hitamo neza. Ongera ukande *789#."
        return _format_ussd_response(msg, start_time)


def _format_ussd_response(response_text, start_time):
    """
    Enforces NFR 6 (`Sub-20-Second Gateway Execution Limit`).
    Logs duration and returns raw text response with plain content type.
    """
    duration = time.time() - start_time
    if duration > 19.5:
        logger.warning(f"USSD_TIMEOUT_WARNING | execution took {duration:.2f}s (approaching 20s telco cutoff)")
    else:
        logger.debug(f"USSD_RESP | duration={duration:.3f}s | response='{response_text[:40]}...'")
    return HttpResponse(response_text, content_type="text/plain; charset=utf-8")
