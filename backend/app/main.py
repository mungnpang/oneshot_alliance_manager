from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import OneshotException
from app.api.v1.router import router

import logging
logger = logging.getLogger("uvicorn")

app = FastAPI(title="oneshot", description="Alliance manager of Kingshot")

_origins = ["*"] if settings.debug else [o.strip() for o in settings.allowed_origins.split(",")]
logger.info(f"CORS allowed_origins: {_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.exception_handler(OneshotException)
async def oneshot_exception_handler(request: Request, exc: OneshotException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
