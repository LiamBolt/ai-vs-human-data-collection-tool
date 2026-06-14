"""Idempotent seeder: loads instrument content (D3/D4) and bootstraps the admin.

Safe to run repeatedly — upserts by natural keys, never duplicates.
"""
from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.enums import StaffRole
from app.instruments import HINTS, TASKS
from app.models import Hint, Site, StaffUser, Task
from app.security import hash_password

DEFAULT_SITES = [
    {"site_code": "ONLINE", "site_name": "Online / Remote"},
    {"site_code": "MAIN", "site_name": "Main Site"},
]

logger = logging.getLogger("aivb.seed")


async def seed_tasks(db: AsyncSession) -> None:
    existing = {
        code for (code,) in (await db.execute(select(Task.task_code))).all()
    }
    for t in TASKS:
        if t["task_code"] in existing:
            # Keep instrument content authoritative on every boot.
            obj = (
                await db.execute(select(Task).where(Task.task_code == t["task_code"]))
            ).scalar_one()
            obj.session_number = t["session_number"]
            obj.display_order = t["display_order"]
            obj.family = t["family"]
            obj.objective_question = t["objective_question"]
            obj.justification_prompt = t["justification_prompt"]
            obj.answer_type = t["answer_type"]
            obj.correct_answer = t["correct_answer"]
            obj.answer_tolerance = t["answer_tolerance"]
            obj.parallel_to = t["parallel_to"]
        else:
            db.add(Task(**t))
    await db.flush()


async def seed_hints(db: AsyncSession) -> None:
    existing = {
        (code, level)
        for (code, level) in (await db.execute(select(Hint.task_code, Hint.level))).all()
    }
    for task_code, levels in HINTS.items():
        for level, text in levels.items():
            if (task_code, level) in existing:
                obj = (
                    await db.execute(
                        select(Hint).where(Hint.task_code == task_code, Hint.level == level)
                    )
                ).scalar_one()
                obj.hint_text = text
            else:
                db.add(Hint(task_code=task_code, level=level, hint_text=text))
    await db.flush()


async def bootstrap_admin(db: AsyncSession) -> None:
    count = (await db.execute(select(func.count()).select_from(StaffUser))).scalar_one()
    if count and count > 0:
        return
    admin = StaffUser(
        username=settings.admin_bootstrap_username,
        password_hash=hash_password(settings.admin_bootstrap_password),
        role=StaffRole.ADMIN,
        display_code="ADMIN-01",
        is_active=True,
    )
    db.add(admin)
    await db.flush()
    logger.warning(
        "[seed] Bootstrap ADMIN created — username=%s (change ADMIN_BOOTSTRAP_PASSWORD in production)",
        settings.admin_bootstrap_username,
    )


async def run_seed(db: AsyncSession) -> None:
    await seed_tasks(db)
    await seed_hints(db)
    await bootstrap_admin(db)
    await db.commit()
    logger.info("[startup] seed verified")
