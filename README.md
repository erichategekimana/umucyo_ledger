# Umucyo Ledger

Umucyo Ledger is a comprehensive, role-based platform designed to manage cooperative agricultural operations. It bridges the gap between smallholder farmers, cooperative staff, veterinarians, and regulators (RCA). The platform provides a robust Django/PostgreSQL backend REST API, a modern React (Vite/Tailwind) web dashboard, and a USSD gateway simulator for offline farmer access.

---

## 🌐 Live Production Deployment Links

The platform is live and deployed on **Render** (PostgreSQL Database, Web Service Backend, and Static Site Frontend):

- 🚀 **Live Web Application (Frontend):** [https://umucyo-ledger-frontend.onrender.com](https://umucyo-ledger-frontend.onrender.com)
- ⚙️ **Live REST API & Django Admin (Backend):** [https://umucyo-ledger.onrender.com](https://umucyo-ledger.onrender.com)
- 🛠️ **Django Admin Portal:** [https://umucyo-ledger.onrender.com/admin/](https://umucyo-ledger.onrender.com/admin/)

---

## Key Features

- **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Farmers, Collection Officers, Managers, Admins, Veterinarians, and Super-Admins (RCA).
- **Append-Only Harvest Ledger:** A secure, immutable ledger for recording crop deliveries. Deliveries can be initiated by Farmers and approved by Collection Officers.
- **Bottom-Up Batch Aggregation:** Deliveries are aggregated into locked seasonal batches.
- **Sales & Payout Distribution:** Bulk sales tracking and automated revenue split calculations based on individual farmer contributions.
- **Agronomy & Anomaly Tracking:** Veterinarians can log disease outbreaks or anomalies, which are visualized on an interactive GIS map.
- **USSD Gateway:** Offline access for farmers to check their balances and market prices via USSD (`*789#`), including a built-in web simulator.
- **Notifications:** Automated system alerts and SMS receipts for deliveries and applications.

## Tech Stack

- **Backend:** Python, Django, Django REST Framework, PostgreSQL
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Leaflet (Maps), Lucide React (Icons)
- **Authentication:** JWT (JSON Web Tokens)

---

## Demo Credentials

You can use the following credentials to explore the different role-based dashboards on both local and production environments:

**Password for all demo accounts:** `Umucyo@2026`

| Username   | Role                               |
|------------|------------------------------------|
| `admin1`   | Cooperative Admin                  |
| `manager1` | Cooperative Manager / Accountant   |
| `officer1` | Collection Officer                 |
| `vet1`     | Veterinarian / Extension Officer   |
| `rca1`     | Super-Admin (RCA regulator)        |

*Note: You can also register a new Farmer account directly on the web application.*

---

## Local Development Setup

Follow these steps to run the platform locally on your machine.

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set up the database (using SQLite for local dev, or PostgreSQL if preferred):
```bash
python manage.py migrate
```

Seed the database with demo data (creates cooperatives, users, farmers, deliveries, etc.):
```bash
python manage.py seed_demo_data
```

Start the backend server:
```bash
python manage.py runserver
```
The backend API is now running at `http://127.0.0.1:8000/`.

### 2. Frontend Setup

Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend application will be available at `http://localhost:5173/`.

---

## Deployment to Render

The project is configured for seamless deployment on [Render](https://render.com/) using a Managed PostgreSQL Database, a Django Web Service, and a React Static Site.

### Active Render Deployment Configuration:

1. **Database (Render PostgreSQL)**:
   - **Service Name:** `umucyo-db` (PostgreSQL 16)

2. **Backend Web Service**:
   - **URL:** [https://umucyo-ledger.onrender.com](https://umucyo-ledger.onrender.com)
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command:** `gunicorn config.wsgi:application`
   - **Key Environment Variables:**
     - `DATABASE_URL`: `<render-internal-db-url>`
     - `SECRET_KEY`: `<production-secret-key>`
     - `DEBUG`: `False`
     - `ALLOWED_HOSTS`: `umucyo-ledger.onrender.com`
     - `CORS_ALLOWED_ORIGINS`: `https://umucyo-ledger-frontend.onrender.com`

3. **Frontend Static Site**:
   - **URL:** [https://umucyo-ledger-frontend.onrender.com](https://umucyo-ledger-frontend.onrender.com)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variable:** `VITE_API_URL` = `https://umucyo-ledger.onrender.com/api/v1`
   - **Rewrite Rule for SPA Routing:**
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** `Rewrite`

---

## Project Structure

```text
umucyo_ledger/
├── backend/                  # Django API
│   ├── apps/                 # Modular domain applications
│   │   ├── accounts/         # RBAC, Authentication, Profiles
│   │   ├── agronomy_monitoring/ # Anomalies, GIS Data
│   │   ├── cooperatives/     # Co-ops, Staff, Farmers
│   │   ├── harvest_ledger/   # Immutable crop deliveries, Batches
│   │   ├── notifications/    # SMS Receipts, System Alerts
│   │   ├── sales_distribution/# Bulk Sales, Payouts
│   │   └── ussd_gateway/     # USSD simulator & webhook
│   ├── common/               # Shared utilities, Base Models, Permissions
│   ├── config/               # Django settings and root URLs
│   └── manage.py
├── frontend/                 # React Dashboard
│   ├── src/
│   │   ├── api/              # Axios API service integrations
│   │   ├── components/       # Reusable UI components & layouts
│   │   ├── config/           # Routes and environment constants
│   │   ├── features/         # Feature-based modular UI (Harvest, Sales, etc.)
│   │   ├── hooks/            # Custom React hooks (useAuth, useRole)
│   │   ├── store/            # Zustand global state management
│   │   └── types/            # TypeScript interfaces
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```
