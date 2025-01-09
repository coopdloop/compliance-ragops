from fastapi.openapi.utils import get_openapi
from main import app
import json


def generate_openapi_spec():
    openapi_schema = get_openapi(
        title="Security Scanner API",
        version="1.0.0",
        description="API for security scanning and compliance monitoring",
        routes=app.routes,
    )

    # Write the OpenAPI spec to a file
    with open("openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=4)


if __name__ == "__main__":
    generate_openapi_spec()
