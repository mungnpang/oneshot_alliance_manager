from fastapi import APIRouter
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.public import router as public_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, tags=["auth"])
router.include_router(public_router, tags=["public"])
router.include_router(admin_router, tags=["admin"])
