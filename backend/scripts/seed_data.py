import os
import random
import sys

from passlib.context import CryptContext
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.category import Category
from app.models.department import Department
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def seed_data():
    db: Session = SessionLocal()
    try:
        if db.query(Department).count() > 0:
            print("Database already seeded. Skipping.")
            return

        deps = ["IT", "HR", "Księgowość", "Produkcja"]
        db_deps = []
        for name in deps:
            dep = Department(name=name)
            db.add(dep)
            db_deps.append(dep)
        db.commit()

        cats = ["Sprzęt", "Oprogramowanie", "Sieć", "Dostępy", "Inne"]
        db_cats = []
        for name in cats:
            cat = Category(name=name)
            db.add(cat)
            db_cats.append(cat)
        db.commit()

        password_hash = get_password_hash("temp123")

        users_data = [
            ("jkowalski", "Jan", "Kowalski", UserRole.reporter, db_deps[3].id),
            ("anowak", "Anna", "Nowak", UserRole.reporter, db_deps[1].id),
            ("pwisniewski", "Piotr", "Wiśniewski", UserRole.reporter, db_deps[2].id),
            ("mwojcik", "Michał", "Wójcik", UserRole.support, db_deps[0].id),
            ("kzielinska", "Katarzyna", "Zielińska", UserRole.support, db_deps[0].id),
        ]

        db_users = []
        for login, fname, lname, role, dep_id in users_data:
            user = User(
                login=login,
                password_hash=password_hash,
                first_name=fname,
                last_name=lname,
                role=role,
                department_id=dep_id,
                is_temporary_password=True,
            )
            db.add(user)
            db_users.append(user)
        db.commit()

        reporters = [u for u in db_users if u.role == UserRole.reporter]
        supports = [u for u in db_users if u.role == UserRole.support]

        ticket_titles = [
            "Myszka nie działa",
            "Zapomniałem hasła",
            "Brak dostępu do VPN",
            "Monitor miga",
            "Nowy pracownik - pakiety",
            "Błąd w programie księgowym",
            "Drukarka brudzi papier",
            "Brak internetu w sali A",
            "Klawiatura zalana",
            "Potrzebny dostęp do GitHub",
            "Prośba o nowy telefon",
            "Nie mogę wysłać maila",
            "Aplikacja HR zawiesza się",
            "Brak wolnego miejsca na dysku",
            "Wirus na komputerze",
            "Konto zablokowane",
            "Aktualizacja systemu operacyjnego",
            "Nowy certyfikat",
            "Wymiana tonera",
            "Słaby zasięg WiFi",
        ]

        priorities = list(TicketPriority)

        for i, title in enumerate(ticket_titles):
            reporter = random.choice(reporters)
            suggested_cat = random.choice(db_cats)
            suggested_prio = random.choice(priorities)

            if i < 5:
                status = TicketStatus.nowe
                assigned = None
                cat = None
                prio = None
            elif i < 8:
                status = TicketStatus.nowe
                assigned = None
                cat = None
                prio = None
                suggested_cat = None
                suggested_prio = None
            elif i < 15:
                status = TicketStatus.przyjete
                assigned = random.choice(supports)
                cat = suggested_cat
                prio = suggested_prio
            else:
                status = TicketStatus.zamkniete
                assigned = random.choice(supports)
                cat = suggested_cat
                prio = suggested_prio

            ticket = Ticket(
                title=title,
                description=f"Automatycznie wygenerowany opis dla zgłoszenia: {title}. Proszę o szybką pomoc.",
                status=status,
                reporter_id=reporter.id,
                assigned_to_id=assigned.id if assigned else None,
                category_id=cat.id if cat else None,
                priority=prio if prio else None,
                suggested_category_id=suggested_cat.id if suggested_cat else None,
                suggested_priority=suggested_prio if suggested_prio else None,
            )
            db.add(ticket)

        db.commit()
        print("Test data seeded successfully.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
