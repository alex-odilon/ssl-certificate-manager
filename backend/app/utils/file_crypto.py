"""
At-rest encryption for private key files using Fernet (AES-128-CBC + HMAC-SHA256).

Encryption is skipped when ENCRYPTION_KEY is not configured so that existing
deployments with no key set continue to work (plain text). A warning is already
emitted at startup in main.py.

Legacy detection: Fernet ciphertext is base64url and never starts with "-----",
so detecting plain PEM headers is sufficient to handle unencrypted legacy files.
"""
import hashlib
import base64
import logging

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger("ssl_manager.file_crypto")


def _fernet_from_material(key_material: str) -> Fernet:
    digest = hashlib.sha256(key_material.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_file(content: bytes, encryption_key: str) -> bytes:
    """Encrypt content. Returns plaintext unchanged when encryption_key is empty."""
    if not encryption_key:
        return content
    return _fernet_from_material(encryption_key).encrypt(content)


def decrypt_file(content: bytes, encryption_key: str) -> bytes:
    """Decrypt content. Handles legacy plain-text files transparently.

    Detection strategy:
    - PEM files start with "-----BEGIN"
    - OpenSSH private keys start with "-----BEGIN OPENSSH"
    - Fernet ciphertext starts with "gAAAAA" (base64url of a byte that is never '-')
    """
    if not encryption_key:
        return content

    if content.startswith(b"-----") or content.startswith(b"ssh-"):
        return content

    try:
        return _fernet_from_material(encryption_key).decrypt(content)
    except (InvalidToken, Exception):
        logger.warning("decrypt_file: failed to decrypt — returning raw content")
        return content


def is_valid_pem(content: bytes) -> bool:
    """Return True if content contains at least one PEM block."""
    text = content.decode("utf-8", errors="ignore")
    return "-----BEGIN" in text and "-----END" in text
