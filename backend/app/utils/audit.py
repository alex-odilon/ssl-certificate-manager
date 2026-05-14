"""Thin helper for writing AuditLog entries.

Import and call record() in any router that performs a security-relevant action.
The commit is intentionally done inside record() so audit entries are written
even when the caller later rolls back its own transaction (e.g. on error).
A failure to write the audit log is non-fatal — it is logged but not re-raised
so that the original operation is not affected.
"""
import logging
from typing import Optional

from sqlalchemy.orm import Session

logger = logging.getLogger("ssl_manager.audit")


def record(
    db: Session,
    *,
    user_id: Optional[int],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    try:
        from app.models import AuditLog  # local import to avoid circular deps at module init
        db.add(AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
        ))
        db.commit()
    except Exception as exc:
        logger.error("Failed to write audit log", extra={"action": action, "error": str(exc)})
