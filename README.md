# HelpDesk

System obsługi zgłoszeń IT dla małych i średnich organizacji. Umożliwia rejestrowanie zgłoszeń przez pracowników, ich obsługę przez zespół supportu oraz zarządzanie użytkownikami i statystykami przez administratora. Integracja z LLM (Gemini) automatycznie proponuje kategorię i priorytet każdego nowego zgłoszenia.

## Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Frontend | React 18, TypeScript, Vite |
| Baza danych | PostgreSQL 16 |
| Uwierzytelnianie | JWT (access + refresh token w cookie httpOnly) |
| LLM | Google Gemini API |
| Reverse proxy | Caddy 2 |
| Konteneryzacja | Docker / Docker Compose |
| Linting (backend) | Ruff, Mypy |
| Linting (frontend) | Oxlint, TypeScript |
| Testy | Pytest (unit + integration) |
| CI | GitHub Actions |

## Architektura

```
+-----------+     HTTP      +----------+     +--------------+
| Przegla-  |<------------->|  Caddy   |---->|   Frontend   |
| darka     |               | (proxy)  |     | (Vite/React) |
+-----------+               +----+-----+     +--------------+
                                 | /api/*
                           +-----v------+     +--------------+
                           |  Backend   |---->|  PostgreSQL  |
                           |  (FastAPI) |     +--------------+
                           +-----+------+
                                 | background task
                           +-----v------+
                           | Gemini API |
                           +------------+
```

Caddy działa jako reverse proxy na porcie `80` i kieruje ruch:
- `/api/*` → backend (port `8000`)
- `/*` → frontend (port `5173`)

Dzięki temu frontend i API mają wspólny origin, co umożliwia bezpieczne ciasteczka `SameSite=Strict`.

### Struktura katalogów

```
HelpDesk/
├── backend/
│   ├── app/
│   │   ├── core/          # konfiguracja, baza, security, LLM client
│   │   ├── dependencies/  # FastAPI dependencies (auth, db)
│   │   ├── exceptions/    # własne klasy wyjątków HTTP
│   │   ├── models/        # modele SQLAlchemy (ORM)
│   │   ├── repositories/  # warstwa dostępu do danych
│   │   ├── routers/       # endpointy FastAPI
│   │   ├── schemas/       # Pydantic schemas (walidacja I/O)
│   │   ├── services/      # logika biznesowa
│   │   └── main.py        # punkt wejścia aplikacji
│   ├── alembic/           # migracje bazy danych
│   ├── scripts/           # create_admin.py, seed_data.py
│   └── tests/             # testy jednostkowe i integracyjne
├── frontend/
│   └── src/
│       ├── api/           # klienci HTTP (fetch wrappers)
│       ├── components/    # komponenty React
│       ├── context/       # AuthContext
│       ├── pages/         # strony aplikacji
│       └── types/         # typy TypeScript
├── docs/                  # diagramy, model API, ERD
├── Caddyfile              # konfiguracja reverse proxy
└── docker-compose.dev.yml
```

### Przepływ uwierzytelniania

1. Użytkownik loguje się przez `POST /api/v1/auth/login`.
2. Backend wydaje dwa tokeny JWT: `access_token` (15 min) i `refresh_token` (7 dni), zapisane w ciasteczkach `httpOnly; Secure; SameSite=Strict`.
3. Przy każdym żądaniu `get_current_user` weryfikuje `access_token` z ciasteczka i sprawdza aktualny stan konta w bazie (aktywność, flaga tymczasowego hasła).
4. Gdy `access_token` wygaśnie, frontend automatycznie wywołuje `POST /api/v1/auth/refresh` — następuje rotacja `refresh_token` (stary jest unieważniany w bazie).
5. Wylogowanie, zmiana hasła lub edycja konta przez admina unieważnia wszystkie `refresh_token` użytkownika, co wymusza ponowne logowanie przy następnym żądaniu.

### Integracja z LLM

Po utworzeniu nowego zgłoszenia backend uruchamia `generate_ticket_suggestion` jako `BackgroundTask`. Funkcja:

1. Pobiera treść opisu i listę aktywnych kategorii.
2. Wysyła zapytanie do Gemini API (tylko opis + lista kategorii, bez danych osobowych).
3. Waliduje odpowiedź — kategoria musi być z aktualnej listy, priorytet z dozwolonego zbioru.
4. Zapisuje sugestię w osobnych polach (`suggested_category_id`, `suggested_priority`).
5. Niezależnie od powodzenia czyści flagę `is_ai_processing`.

Sugestia **nigdy** nie jest zapisywana jako finalna wartość automatycznie — Support lub Admin musi ją zatwierdzić lub poprawić przy przypisaniu zgłoszenia.

## Uruchomienie lokalne (Docker Compose)

### Wymagania

- Docker Desktop
- Klucz API Google Gemini

### Kroki

**1. Sklonuj repozytorium**

```bash
git clone https://github.com/Barry4747/HelpDesk.git
cd HelpDesk
```

**2. Utwórz plik środowiskowy**

```bash
cp backend/.env.docker.example backend/.env.docker
```

Otwórz `backend/.env.docker` i uzupełnij:

```env
POSTGRES_USER=helpdesk
POSTGRES_PASSWORD=changeme
POSTGRES_DB=helpdesk

DATABASE_URL=postgresql://helpdesk:changeme@postgres:5432/helpdesk
JWT_SECRET=<losowy_tajny_ciag_znakow>
GEMINI_API_KEY=<twoj_klucz_gemini>
```

**3. Uruchom kontenery**

```bash
docker compose -f docker-compose.dev.yml up --build
```

**4. Uruchom migracje bazy danych**

```bash
docker exec helpdesk-backend-dev alembic upgrade head
```

**5. (Opcjonalnie) Załaduj dane testowe**

```bash
docker exec helpdesk-backend-dev python scripts/seed_data.py
```

**6. Utwórz konto administratora**

```bash
docker exec -it helpdesk-backend-dev python scripts/create_admin.py --login admin
```

Hasło podaj interaktywnie lub przez zmienną środowiskową `ADMIN_PASSWORD` (hasło nie trafi do historii powłoki).

**7. Otwórz aplikację**

Aplikacja dostępna pod adresem: **http://localhost**

Dokumentacja API (Swagger): **http://localhost/api/docs**

---

### Przydatne komendy

| Cel | Komenda |
|---|---|
| Zatrzymaj kontenery | `docker compose -f docker-compose.dev.yml down` |
| Logi backendu | `docker logs -f helpdesk-backend-dev` |
| Logi frontendu | `docker logs -f helpdesk-frontend-dev` |
| Nowa migracja Alembic | `docker exec helpdesk-backend-dev alembic revision --autogenerate -m "opis"` |
| Uruchom testy | patrz sekcja niżej |

### Baza testowa i uruchamianie testów

Testy integracyjne wymagają osobnej bazy PostgreSQL. Utwórz ją jednorazowo:

```bash
docker exec helpdesk-postgres-dev psql -U helpdesk -c "CREATE DATABASE helpdesk_test;"
```

Uruchom testy:

```bash
docker exec helpdesk-backend-dev bash -c \
  "TEST_DATABASE_URL=postgresql://helpdesk:changeme@postgres:5432/helpdesk_test pytest tests/ -v"
```

## Uruchomienie lokalne (bez Dockera)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # uzupełnij DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> Bez reverse proxy ciasteczka `SameSite=Strict` mogą nie działać poprawnie między `localhost:5173` a `localhost:8000`. Zalecane jest środowisko Docker z Caddy.

## Zmienne środowiskowe

| Zmienna | Opis | Wymagana |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | tak |
| `JWT_SECRET` | Tajny klucz do podpisywania tokenów JWT | tak |
| `GEMINI_API_KEY` | Klucz API Google Gemini | tak |
| `JWT_ALGORITHM` | Algorytm JWT (domyślnie `HS256`) | nie |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Czas życia access tokena (domyślnie `15`) | nie |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Czas życia refresh tokena (domyślnie `7`) | nie |
| `GEMINI_MODEL` | Model Gemini (domyślnie `gemini-3.5-flash-lite`) | nie |
| `GEMINI_TIMEOUT_SECONDS` | Timeout wywołania API (domyślnie `90`) | nie |

## Role użytkowników

| Rola | Uprawnienia |
|---|---|
| **Reporter** | Tworzy zgłoszenia, widzi tylko własne |
| **Support** | Widzi nieprzypisane nowe zgłoszenia oraz własne przypisane, może je edytować i zmieniać status |
| **Admin** | Pełen dostęp do zgłoszeń, użytkowników, kategorii, działów i statystyk |

Konta administracyjne tworzy się wyłącznie skryptem `create_admin.py`. Panel admina nie pozwala na nadanie roli `admin`.
