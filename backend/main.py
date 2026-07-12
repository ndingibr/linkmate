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
from app.services.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist before serving. (For real schema management, migrate
    # to Alembic rather than creating tables at startup.)
    init_db()
    # Start the background Trade-Caching Scheduler Task
    asyncio.create_task(start_scheduler())
    yield


app = FastAPI(title="Generative Search MVP with Quotes", lifespan=lifespan)

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
