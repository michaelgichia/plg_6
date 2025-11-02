# 🔄 Render Free PostgreSQL DB Rotator

This script automates replacing a Render.com free-tier PostgreSQL database with a new one — useful for avoiding quota limits **without upgrading** to a paid plan.

---

## ⚙️ What It Does

1. **Creates** a new free PostgreSQL database using the Render API.
2. **Migrates** your existing data from the old DB to the new one (via `pg_dump` and `psql`).
3. **Updates** the api's database environment variable values via the Render API.
4. **Triggers a deploy** so your app uses the new database immediately.

---

## 📦 Prerequisites

- Python 3.8+
- `pg_dump` and `psql` installed and accessible from your shell
- Your Render **API Key**
- Your **Service ID** (of the web service using the DB)

---

## 🔐 Setup

1. Clone the repo:
   ```bash
   cd render-db-rotator
   node index
