import hashlib
import hmac
import json
import base64
import time
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv('JWT_SECRET', 'smartcv-local-secret-change-in-production')
TOKEN_EXPIRY = 7 * 24 * 3600  # 7 days


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    return f'{salt}:{hashed}'


def verify_password(password: str, stored: str) -> bool:
    salt, hashed = stored.split(':')
    check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    return hmac.compare_digest(hashed, check)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + '=' * padding)


def create_token(user_id: str, email: str) -> str:
    header = _b64url_encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
    payload = _b64url_encode(json.dumps({
        'user_id': user_id,
        'email': email,
        'exp': int(time.time()) + TOKEN_EXPIRY
    }).encode())
    signature = _b64url_encode(
        hmac.new(JWT_SECRET.encode(), f'{header}.{payload}'.encode(), hashlib.sha256).digest()
    )
    return f'{header}.{payload}.{signature}'


def verify_token(token: str) -> Optional[dict]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        header, payload, signature = parts

        expected_sig = _b64url_encode(
            hmac.new(JWT_SECRET.encode(), f'{header}.{payload}'.encode(), hashlib.sha256).digest()
        )

        if not hmac.compare_digest(signature, expected_sig):
            return None

        data = json.loads(_b64url_decode(payload))

        if data.get('exp', 0) < time.time():
            return None

        return data
    except Exception:
        return None
