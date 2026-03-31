---
name: SSL Certificate Manager - Architecture
description: Key architectural facts about the ssl-certificate-manager project
type: project
---

Full-stack SSL/TLS certificate management app. Stack: FastAPI (Python 3.11) backend + React 18 + TypeScript + MUI v5 frontend + PostgreSQL 15 + Docker Compose.

**Critical quirk**: Python package shadowing — `app/models/__init__.py` and `app/schemas/__init__.py` are the files Python ACTUALLY imports (the `app/models.py` and `app/schemas.py` at root level are shadowed by the directories and never used). Always edit the `__init__.py` files inside `app/models/` and `app/schemas/`.

**Why:** Python's import system gives packages (directories) priority over same-name .py files. The `san_domains` field was missing from `schemas/__init__.py` while present only in the shadowed `schemas.py`, which caused SAN generation to silently fail.

**How to apply:** When editing models or schemas, check and update `backend/app/models/__init__.py` and `backend/app/schemas/__init__.py`, not the root-level `.py` files.
