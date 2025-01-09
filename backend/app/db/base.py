# app/db/base.py
from app.db.base_class import Base  # noqa

# Models should be imported in a specific order to handle dependencies
from app.models.user import User  # noqa
from app.models.scan import ScanResult  # noqa
from app.models.document import ComplianceDocument  # noqa
from app.models.service_account import ServiceAccount  # noqa

# Import all models here for Alembic autogenerate feature
