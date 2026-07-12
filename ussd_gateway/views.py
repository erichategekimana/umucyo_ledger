"""
USSD Gateway simulator.

Implements FR 1.0/1.1/1.2 (Farmer USSD Session Management, Menu Navigation,
Historical Delivery Query) using the same request contract as Africa's
Talking's USSD callback (sessionId, phoneNumber, text), per SRS 2.7 and the
component diagram (Africa's Talking / Telco Gateway -> Django API Hub).

Menu:
  1 - Deliveries (last 3)
  2 - Balance (season total)
  3 - Market price (placeholder reference price)
"""
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from ledger.models import Farmer


def _lookup_farmer(phone_number):
    try:
        return Farmer.objects.get(phone_number=phone_number)
    except Farmer.DoesNotExist:
        return None


@csrf_exempt
def ussd_callback(request):
    """
    Africa's Talking style callback. Text accumulates each round as
    "1*2" etc. Every response is prefixed CON (continue session) or
    END (terminate session), enforced within a single HTTP POST/response
    round-trip to respect the 20-second telco USSD timeout (SRS 2.5/3.4).
    """
    phone_number = request.POST.get("phoneNumber", request.GET.get("phoneNumber", ""))
    text = request.POST.get("text", request.GET.get("text", "")).strip()

    farmer = _lookup_farmer(phone_number)
    steps = text.split("*") if text else []

    if not farmer:
        response = f"END No farmer account found for {phone_number}. Please contact your cooperative office."
        return HttpResponse(response, content_type="text/plain")

    if steps == [""] or steps == []:
        response = (
            "CON Murakaza neza kuri Umucyo Ledger\n"
            "1. Ibyo natanze (Deliveries)\n"
            "2. Amafaranga/Uburemere (Balance)\n"
            "3. Igiciro cy'isoko (Market Price)"
        )
    elif steps[0] == "1":
        data = farmer.query_balance()
        lines = [f"{d['crop_type']}: {d['weight_kg']}kg" for d in data["last_deliveries"]] or ["Nta makuru araboneka"]
        response = "END Ibyo watanze vuba:\n" + "\n".join(lines)
    elif steps[0] == "2":
        total = farmer.total_season_kg
        response = f"END Uburemere bwose bw'iki gihembwe: {total}kg"
    elif steps[0] == "3":
        response = "END Igiciro cy'isoko: Reba ku biro by'ikoperative yawe cyangwa uhamagare 2500."
    else:
        response = "END Ihitamo ntiryemewe. Ongera ugerageze."

    return HttpResponse(response, content_type="text/plain")


def ussd_simulator_page(request):
    """A tiny browser-based USSD phone simulator for demoing FR 1.x without a real telco SIM."""
    return render(request, "ussd_gateway/simulator.html")
