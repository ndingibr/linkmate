"""Application entrypoint.

Builds the FastAPI app: configures CORS, runs startup init, mounts the API
routers, and serves the built React frontend. Route handlers live under
``app/api/`` (one router per domain); this module stays thin.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import asyncio
from app.api import api_router
from app.core.config import settings
from app.log import init_db


async def periodic_matching_scheduler():
    from app.services.matching_service import run_matching_cycle
    import logging
    logger = logging.getLogger("main.scheduler")
    # Wait a brief moment on startup before executing
    await asyncio.sleep(10)
    while True:
        try:
            logger.info("Executing periodic matching task...")
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, run_matching_cycle)
        except Exception as e:
            logger.error(f"Error in matching scheduler loop: {e}")
        await asyncio.sleep(1800) # 30 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    matching_task = asyncio.create_task(periodic_matching_scheduler())
    yield
    matching_task.cancel()


app = FastAPI(
    title="Generative Search MVP with Quotes",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None
)

from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.js",
        swagger_css_url="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.css"
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title + " - ReDoc",
        redoc_js_url="https://cdnjs.cloudflare.com/ajax/libs/redoc/2.1.3/redoc.standalone.js"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # allow GET, POST, etc.
    allow_headers=["*"],
)

# API routes first...
app.include_router(api_router)

# ...then the SPA catch-all, so it never shadows an API route.
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as ex:
            if ex.status_code == 404:
                return await super().get_response("index.html", scope)
            raise ex

app.mount(
    "/",
    SPAStaticFiles(directory="app/static", html=True),
    name="static",
)
