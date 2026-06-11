"""Standalone DB-readiness probe used by entrypoint.sh before migrations."""
import asyncio

from app.database import wait_for_db


def main() -> None:
    asyncio.run(wait_for_db())


if __name__ == "__main__":
    main()
