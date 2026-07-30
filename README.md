# Umucyo Ledger

Umucyo Ledger is a comprehensive, role-based platform designed to manage cooperative agricultural operations. It bridges the gap between smallholder farmers, cooperative staff, veterinarians, and regulators (RCA). The platform provides a robust Django/PostgreSQL backend REST API, a modern React (Vite/Tailwind) web dashboard, and a USSD gateway simulator for offline farmer access.

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

## Demo Credentials

If you ran the `seed_demo_data` command, you can use the following credentials to explore the different role-based dashboards. 

**Password for all demo accounts:** `Umucyo@2026`

| Username   | Role                               |
|------------|------------------------------------|
| `admin1`   | Cooperative Admin                  |
| `manager1` | Cooperative Manager / Accountant   |
| `officer1` | Collection Officer                 |
| `vet1`     | Veterinarian / Extension Officer   |
| `rca1`     | Super-Admin (RCA regulator)        |

*Note: You can also register a new Farmer account via the signup page.*

---

## Deployment to Render

You can easily deploy Umucyo Ledger to [Render](https://render.com/) using Web Services and a Managed PostgreSQL Database.

### 1. Database Setup
1. In your Render Dashboard, click **New** -> **PostgreSQL**.
2. Name it (e.g., `umucyo-db`) and create it.
3. Once created, copy the **Internal Database URL**.

### 2. Backend Deployment
1. Click **New** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `umucyo-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command:** `gunicorn config.wsgi:application`
4. Add Environment Variables:
   - `DATABASE_URL`: Paste the Internal Database URL from Step 1.
   - `SECRET_KEY`: `<generate-a-secure-random-string>`
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `<your-render-backend-url>` (e.g., `umucyo-backend.onrender.com`)
   - `CORS_ALLOWED_ORIGINS`: `<your-render-frontend-url>` (e.g., `https://umucyo-frontend.onrender.com`)
5. Click **Create Web Service**.

### 3. Frontend Deployment
1. Click **New** -> **Static Site**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `umucyo-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `<your-render-backend-url>/api/v1` (e.g., `https://umucyo-backend.onrender.com/api/v1`)
5. Click **Create Static Site**.
6. **Important for React Router:** In the Render settings for your Static Site, go to the **Redirects/Rewrites** section and add a rule to support client-side routing:
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
