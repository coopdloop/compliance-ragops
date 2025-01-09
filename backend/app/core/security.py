# core/security.py
import secrets
from datetime import datetime, timedelta
from typing import Optional

import jwt
from cryptography.fernet import Fernet
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_service_token(
    service_account_id: int,
    service_name: str,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, str]:
    """Create a service account token and its hash"""
    expire = datetime.utcnow() + (expires_delta or timedelta(days=30))
    to_encode = {
        "sub": f"service:{service_account_id}",
        "name": service_name,
        "exp": expire,
    }
    # Create token
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    # Token hash
    token_hash = pwd_context.hash(token)

    # return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, token_hash


def verify_service_token(token: str, token_hash: str) -> bool:
    """Verify a service account token against its stored hash"""
    return pwd_context.verify(token, token_hash)


def create_api_key() -> tuple[str, str]:
    """Create an API key and its hash"""
    api_key = secrets.token_urlsafe(32)
    api_key_hash = pwd_context.hash(api_key)
    return api_key, api_key_hash


def verify_api_key(api_key: str, api_key_hash: str) -> bool:
    """Verify an API key against its stored hash"""
    return pwd_context.verify(api_key, api_key_hash)


def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data (like API keys)"""
    try:
        fernet = Fernet(settings.ENCRYPTION_KEY.encode())
        return fernet.encrypt(data.encode()).decode()
    except ValueError as e:
        raise ValueError(f"Invalid encryption key: {e}")


def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    try:
        fernet = Fernet(settings.ENCRYPTION_KEY.encode())
        return fernet.decrypt(encrypted_data.encode()).decode()
    except ValueError as e:
        raise ValueError(f"Decryption failed: {e}")
