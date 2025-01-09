import json
from typing import Dict, Generator

import httpx
import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.user import User
from app.models.service_account import ServiceAccount

settings = get_settings()
security = HTTPBearer()


# Cache for JWKS
jwks_cache: Dict = {}


def get_db() -> Generator:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    try:
        # Try HS256 service token first
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            if "service:" in payload.get("sub", ""):
                # Service token validation
                service_account = (
                    db.query(ServiceAccount)
                    .filter(
                        ServiceAccount.id == int(payload["sub"].split(":")[1]),
                        ServiceAccount.is_active,
                    )
                    .first()
                )
                if service_account:
                    return {"sub": payload["sub"], "name": payload["name"]}
        except jwt.InvalidTokenError:
            pass
        token = credentials.credentials

        # Get the key ID from the token header
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        # Get the public key
        if kid not in jwks_cache:
            async with httpx.AsyncClient() as client:
                jwks_url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
                response = await client.get(jwks_url)
                jwks = response.json()

                for key in jwks["keys"]:
                    if key["kid"] == kid:
                        jwks_cache[kid] = jwt.get_algorithm_by_name("RS256").from_jwk(
                            json.dumps(key)
                        )
                        break

        if kid not in jwks_cache:
            raise HTTPException(
                status_code=401, detail="Unable to find appropriate key"
            )

        # Verify the token
        payload = jwt.decode(
            token,
            jwks_cache[kid],
            algorithms=settings.ALGORITHMS,
            audience=settings.AUTH0_AUDIENCE,
            issuer=f"https://{settings.AUTH0_DOMAIN}/",
        )

        # Get or create user
        user = db.query(User).filter(User.auth0_id == payload["sub"]).first()
        if not user:
            user = User(
                auth0_id=payload["sub"],
                email=payload.get("email"),
                name=payload.get("name"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
