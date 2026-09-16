# HelpDesk

System zarządzania zgłoszeniami serwisowymi — szkielet projektu (dzień 6 harmonogramu praktyk).

## Wymagania wstępne

| Narzędzie | Minimalna wersja |
|-----------|-----------------|
| Python    | 3.12            |
| Node.js   | 20 LTS          |
| Docker    | 24+             |
| uv        | 0.4+            |

## Uruchomienie lokalne

### Krok 0 — sklonuj repo i utwórz pliki `.env`

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

> **Ważne:** Pliki `.env` są w `.gitignore` i nigdy nie powinny trafić do repozytorium.

---

### Krok 1 — uruchom bazę danych (tylko PostgreSQL w Dockerze)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Weryfikacja: `docker ps` powinien pokazać kontener `helpdesk-postgres-dev`.

---

### Krok 2 — uruchom backend

```bash
cd backend

uv venv .venv
uv pip install -r requirements.txt

.venv\Scripts\activate

uvicorn app.main:app --reload
```

Backend będzie dostępny pod adresem: **http://localhost:8000**  
Dokumentacja Swagger UI: **http://localhost:8000/docs**  
Weryfikacja szkieletu: **http://localhost:8000/health** → `{"status": "ok"}`

---

### Krok 3 — uruchom frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend będzie dostępny pod adresem: **http://localhost:5173**

---

## Struktura projektu (szkielet)

```
helpdesk/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── dependencies/
│   │   │   └── database.py
│   │   ├── exceptions/
│   │   │   └── base.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── routers/
│   ├── alembic/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── exceptions/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx
│   └── .env.example
├── docker-compose.dev.yml
├── .gitignore
└── README.md
```

## Harmonogram implementacji

| Dzień | Zakres |
|-------|--------|
| **6** | Szkielet projektu i konfiguracja środowiska |
| 7     | Modele SQLAlchemy + pierwsza migracja Alembic |
| 8     | Endpointy CRUD + autentykacja JWT |
| 9–12  | Logika biznesowa, integracja, testy |
| 13    | Konteneryzacja pełnej aplikacji (Docker Compose) |
| 14    | CI/CD (GitHub Actions) |
