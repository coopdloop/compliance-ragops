# app/db/init.py
import logging
from sqlalchemy.exc import SQLAlchemyError
from app.db.session import engine
from app.db.base import Base
import app.models  # noqa

# from app.db.base import Base

logger = logging.getLogger(__name__)


def init_db() -> None:
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database initialized successfully")
    except SQLAlchemyError as e:
        logger.error(f"❌ Error initializing database: {str(e)}")
        raise
