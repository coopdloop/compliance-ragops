# migrations/versions/001_add_ai_features.py
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = "001_add_ai_features"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to scan_results
    op.add_column(
        "scan_results", sa.Column("compliance_score", sa.Float(), nullable=True)
    )

    # Create ai_recommendations table
    op.create_table(
        "ai_recommendations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("severity", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["scan_id"], ["scan_results.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create ai_preferences table
    op.create_table(
        "ai_preferences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("preferred_model", sa.String(), nullable=True),
        sa.Column("auto_analysis", sa.Boolean(), default=True),
        sa.Column("notification_preferences", sa.Text(), nullable=True),
        sa.Column("last_updated", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add indexes
    op.create_index("idx_scan_date", "scan_results", ["scan_date"])
    op.create_index("idx_project_name", "scan_results", ["project_name"])
    op.create_index("idx_compliance_score", "scan_results", ["compliance_score"])
    op.create_index("idx_user_scans", "scan_results", ["user_id", "scan_date"])

    op.create_index("idx_recommendation_date", "ai_recommendations", ["created_at"])
    op.create_index("idx_recommendation_scan", "ai_recommendations", ["scan_id"])
    op.create_index("idx_recommendation_severity", "ai_recommendations", ["severity"])

    op.create_index("idx_ai_pref_user", "ai_preferences", ["user_id"])


def downgrade():
    # Remove indexes
    op.drop_index("idx_scan_date")
    op.drop_index("idx_project_name")
    op.drop_index("idx_compliance_score")
    op.drop_index("idx_user_scans")
    op.drop_index("idx_recommendation_date")
    op.drop_index("idx_recommendation_scan")
    op.drop_index("idx_recommendation_severity")
    op.drop_index("idx_ai_pref_user")

    # Drop tables
    op.drop_table("ai_recommendations")
    op.drop_table("ai_preferences")

    # Remove columns
    op.drop_column("scan_results", "compliance_score")
