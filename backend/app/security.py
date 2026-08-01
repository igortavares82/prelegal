"""Password hashing and session token helpers.

Pure stdlib (hashlib + secrets) — no extra dependency needed for a
single-container app with no cross-service verification requirements.
"""

import hashlib
import hmac
import secrets

_ITERATIONS = 260_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), _ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest_hex = stored.split("$", 1)
    except ValueError:
        return False
    expected = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), _ITERATIONS)
    return hmac.compare_digest(expected.hex(), digest_hex)


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


# A valid-shaped hash with no real password behind it, so login can run the
# same PBKDF2 cost for an unknown email as for a known one — otherwise the
# response time itself would reveal whether an email is registered.
DUMMY_PASSWORD_HASH = hash_password(secrets.token_hex(16))
