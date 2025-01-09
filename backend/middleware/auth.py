# middleware/auth.py
import json
import logging
import os
from typing import Dict

import httpx
import jwt
from app.core.config import get_settings
from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

security = HTTPBearer()

load_dotenv()

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]  # For Auth0 JWT verification

if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
    raise ValueError("Missing Auth0 configuration. Please check your .env file.")

# Cache for the JWKS
jwks_cache: Dict = {}


settings = get_settings()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> Dict:
    """
    Validate JWT token and return user info
    """
    token = credentials.credentials
    try:

        # Check if service token
        if "service:" in jwt.decode(token, options={"verify_signature": False}).get(
            "sub", ""
        ):
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                return {"sub": payload["sub"], "name": payload["name"]}
            except jwt.InvalidTokenError:
                pass
        # Get the key ID from the token header
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        # Get the public key
        if kid not in jwks_cache:
            async with httpx.AsyncClient() as client:
                jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
                logger.debug(f"Fetching JWKS from {jwks_url}")
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
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )

        return {
            "sub": payload["sub"],
            "email": payload.get("email", ""),
            "name": payload.get("name", ""),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.DecodeError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
