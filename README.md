# Umucyo Ledger — v1.0.0-Beta (first build)

A working first cut of the platform described in the SRS: Django/PostgreSQL
backend, a REST API, a USSD gateway simulator for farmers, and a React
(no-build) dashboard for cooperative staff, veterinarians, and RCA regulators.

This is a **first working slice**, not the finished product — see "What's
built" / "What's next" below.

## Quick start (SQLite, zero config)

```bash
cd umucyo_ledger
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data      # creates demo cooperative, users, farmers, deliveries
python manage.py createsuperuser     # optional, for /admin/
python manage.py runserver
```

Then open:
- **http://127.0.0.1:8000/** — the cooperative dashboard (React, no build step)
- **http://127.0.0.1:8000/ussd/simulator/** — a phone-shaped USSD simulator for farmers
- **http://127.0.0.1:8000/admin/** — Django admin (raw data / superuser)
- **http://127.0.0.1:8000/api/v1/** — the REST API (DRF browsable API)

### Demo logins (password `Umucyo@2026`)
| Username | Role |
|---|---|
| `admin1` | Cooperative Admin |
| `manager1` | Cooperative Manager / Accountant |
| `officer1` | Collection Officer |
| `vet1` | Veterinarian / Extension Officer |
| `rca1` | Super-Admin (RCA regulator, also Django superuser) |

Demo farmer phone numbers for the USSD simulator: `0788000001`, `0788000002`, `0788000003`.

## Switching to PostgreSQL 16 (matches the SRS target environment)

```bash
createdb umucyo_ledger   # or via psql: CREATE DATABASE umucyo_ledger;
export USE_POSTGRES=1
export DB_NAME=umucyo_ledger DB_USER=umucyo DB_PASSWORD=umucyo DB_HOST=localhost DB_PORT=5432
python manage.py migrate
python manage.py seed_demo_data
```

## What's built (maps to the SRS functional requirements)

- **FR 1.x — Farmer USSD** (`ussd_gateway/`): session-based menu (deliveries /
  balance / market price) speaking Africa's Talking's `sessionId` /
  `phoneNumber` / `text` protocol at `/ussd/callback/`, plus a browser phone
  simulator at `/ussd/simulator/` so it's demoable without a telco SIM.
- **FR 2.x — Field weight capture** (`ledger/models.py: CropDelivery`):
  bounds-validated (0.1–1500 kg), append-only at the model layer — `save()`
  blocks edits to an existing row and `delete()` is disabled outright.
- **FR 3.x — Instant notification**: an SMS receipt (`Notification` model) is
  generated automatically the moment a delivery is logged.
- **FR 4.x — Bottom-up, inalterable batch totals**: `BatchTotal.total_weight_kg`
  is only ever set by a `SUM()` over its deliveries; `lock_batch()` freezes it
  before a sale, and `flag_discrepancy()` checks it against an external
  invoice figure.
- **FR 5.x / 6.x — Bulk sales & revenue split**: recording a sale, verifying
  the bank transfer, and `calculate_revenue_split()` computing each farmer's
  proportional payout from `contribution_kg / batch_kg × sale_price`.
- **FR 7.x — Agronomic/veterinary anomalies**: `AnomalyReport` with
  sector/coordinates/severity, exposed to Admins, Vets and RCA.
- **NFR 1 — Role separation**: enforced in `ledger/permissions.py` (e.g. a
  Collection Officer cannot see the revenue dashboard; only Manager/Admin/
  Super-Admin can record or split sales).
- **NFR 7 — Atomic commits**: revenue-split and seed operations wrapped in
  `transaction.atomic`.
- All six user classes, the six-table class diagram, and the append-only
  "Fraud Block" / "Bottom-Up Link" rules from Appendix B are implemented as
  described.

Automated smoke-tested during this build: login for every role, role-based
403s, weight-bounds validation, the full lock → sell → verify → split flow,
a USSD session end-to-end, and both the append-only and no-delete guarantees
on `CropDelivery`.

## What's next (not yet built)

- FR 7.2's GIS heatmap is currently a plain table — needs an actual map
  widget (e.g. Leaflet) plotting `AnomalyReport.latitude/longitude`.
- No automated test suite (`pytest`/`django.test`) yet — only manual/scripted
  smoke checks were run for this first pass.
- `AdjustmentLog` model exists but has no API endpoint/UI yet — corrections
  currently require the Django admin.
- No SMS is actually sent (Notification rows simulate the receipt); wiring a
  real Africa's Talking/SMPP account is a config step, not a code change.
- No deployment config (Docker/Gunicorn/Nginx) yet.
- Field Collection Officer flow currently goes through the same web
  dashboard as managers; the SRS calls for a dedicated mobile-optimized
  Collection Officer view.

## Project layout

```
umucyo_ledger/
  config/            # Django project settings/urls
  ledger/            # core domain: models, API, admin, permissions, seed command
  ussd_gateway/       # USSD callback + browser simulator
  templates/dashboard/index.html   # React (CDN, no-build) staff dashboard
  templates/ussd_gateway/simulator.html  # phone-styled USSD simulator
```
