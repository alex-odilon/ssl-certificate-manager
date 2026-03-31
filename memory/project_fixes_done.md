---
name: SSL Certificate Manager - Fixes Applied
description: Summary of all bugs fixed and security improvements made
type: project
---

All fixes were applied in a single session (2026-03-29):

1. **[CRITICAL] san_domains missing from CSRCreate** — Added `san_domains: Optional[List[str]] = []` to `app/schemas/__init__.py`. SAN feature was completely broken because the wrong (shadowed) schemas.py was being used.

2. **PFX passwords lost on restart** — `pfx.py` was calling `Fernet.generate_key()` at module load, generating a new key every restart. Fixed: now derives stable key from `SHA256(SECRET_KEY)` via `_make_fernet()`.

3. **Password exposed in process list** — `create_pfx()` and `validate_pfx()` passed password via `-password pass:XXX` CLI arg (visible in `ps`). Fixed: now uses `-passout stdin` / `-passin stdin` and pipes password via subprocess stdin.

4. **Cryptographically weak password generator** — `generate_password()` used `random` module. Fixed: now uses `secrets.choice()`.

5. **CORS wildcard** — `main.py` had `"*"` in `allow_origins`. Fixed: removed wildcard, kept only `localhost:3000` and `localhost`.

6. **requirements.txt duplicates** — First 10 lines repeated. Fixed: deduplicated.

7. **config.py duplicate imports** — `pydantic_settings` and `Optional` imported twice. Fixed.

8. **Pydantic v2 deprecations** — Replaced `from_orm()` → `model_validate()` in pfx.py; `dict()` → `model_dump()` in csr.py.

9. **Debug print statements** — Removed all `print()` / `traceback.print_exc()` from csr.py and keys.py.

10. **validate-matching placeholder** — `validation.py` always returned `match: True`. Fixed: now calls `check_cert_key_match()` which compares RSA public key numbers.

11. **admin.py broken imports** — Router referenced non-existent schemas and auth functions. Cleared to avoid import errors (not registered in main.py anyway).

12. **Frontend onKeyPress deprecated** — Replaced with `onKeyDown` in GenerateKey, GenerateCSR, GeneratePFX, UploadDialog.

13. **console.log/error in production** — Removed from GenerateCSR, Files, Validation.
