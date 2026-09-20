"""认证服务的公共逻辑与 FastAPI 入口。

启动命令：python -m uvicorn backend.auth.service:app
浏览器先请求 Next.js 的 /api/auth/*，Next.js 再调用本服务。
"""

import hmac
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# 开发时与 Next.js 共用项目根目录的配置；部署时已有环境变量会优先保留。
load_dotenv(Path(__file__).resolve().parents[2] / ".env.local")

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


def reply(status: int, *, data: dict | None = None, code: str = "", message: str = "") -> JSONResponse:
    """统一成功 {data} 和失败 {error} 的响应格式，并禁止缓存认证结果。"""
    body = {"data": data} if data is not None else {"error": {"code": code, "message": message}}
    return JSONResponse(body, status_code=status, headers={"Cache-Control": "private, no-store"})


def unavailable() -> JSONResponse:
    return reply(503, code="AUTH_UNAVAILABLE", message="Authentication is temporarily unavailable.")


async def read_body(request: Request) -> dict | JSONResponse:
    """只接收带内部密钥的 JSON 请求；逐块读取以限制请求体大小。"""
    secret = os.getenv("AUTH_INTERNAL_TOKEN", "")
    supplied = request.headers.get("x-auth-internal-token", "")
    # 这个密钥只由 Next.js 服务端发送，不能交给浏览器。
    if not secret or not hmac.compare_digest(secret, supplied):
        return reply(403, code="FORBIDDEN", message="Authentication request is forbidden.")
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
        return reply(415, code="UNSUPPORTED_MEDIA_TYPE", message="Send a JSON request body.")
    try:
        content_length = int(request.headers.get("content-length", "0") or "0")
        if content_length < 0:
            raise ValueError
        if content_length > 4096:
            return reply(413, code="REQUEST_TOO_LARGE", message="Request body is too large.")
        raw = bytearray()
        async for chunk in request.stream():
            raw.extend(chunk)
            if len(raw) > 4096:
                return reply(413, code="REQUEST_TOO_LARGE", message="Request body is too large.")
        body = json.loads(raw)
        if isinstance(body, dict):
            return body
    except (UnicodeDecodeError, ValueError):
        pass
    return reply(400, code="INVALID_INPUT", message="Send a JSON object with the required fields.")


def email_from(body: dict) -> str | None:
    """提取并标准化邮箱，格式不符合要求时返回 None。"""
    value = body.get("email")
    if not isinstance(value, str):
        return None
    email = value.strip().lower()
    return email if len(email) <= 254 and re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) else None


def password_from(body: dict) -> str | None:
    """这里只检查请求格式；真正的密码策略仍由 Supabase Auth 决定。"""
    value = body.get("password")
    return value if isinstance(value, str) and 6 <= len(value) <= 1024 else None


def code_from(body: dict) -> str | None:
    """验证码以字符串传递，保留可能存在的前导零。"""
    value = body.get("code")
    return value if isinstance(value, str) and re.fullmatch(r"\d{4,10}", value) else None


def provider_failure(status: int, payload: dict, action: str) -> JSONResponse:
    """把 Supabase 错误转换为前端约定的稳定错误码。"""
    provider_code = payload.get("error_code") or payload.get("code") or ""
    if status == 429 or provider_code in {"over_email_send_rate_limit", "over_request_rate_limit"}:
        return reply(429, code="RATE_LIMITED", message="Please wait before trying again.")
    if status >= 500:
        return unavailable()
    if action == "sign-in":
        # 登录失败统一提示，避免向页面泄露账号是否存在。
        if provider_code == "email_not_confirmed":
            return reply(403, code="EMAIL_NOT_CONFIRMED", message="Confirm your email before signing in.")
        return reply(401, code="INVALID_CREDENTIALS", message="Email or password is incorrect.")
    if action == "verify-email":
        return reply(400, code="INVALID_OR_EXPIRED_CODE", message="The code is invalid or expired.")
    if action == "sign-up":
        if provider_code in {"user_already_exists", "email_exists"}:
            return reply(409, code="EMAIL_ALREADY_REGISTERED", message="This email is already registered.")
        if provider_code == "weak_password":
            return reply(400, code="WEAK_PASSWORD", message="Choose a stronger password.")
        return reply(400, code="SIGN_UP_FAILED", message="Unable to register with these details.")
    return reply(400, code="RESEND_FAILED", message="Unable to resend the code.")


async def supabase_post(path: str, body: dict, action: str, access_token: str | None = None) -> dict | JSONResponse:
    """向 Supabase Auth 发送请求；只允许 HTTPS 或本机 HTTP 开发地址。"""
    base = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    parsed = urlparse(base)
    if not key or not parsed.hostname or parsed.scheme not in {"https", "http"} or parsed.username or parsed.password:
        return unavailable()
    if parsed.scheme == "http" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        return unavailable()
    headers = {"apikey": key, "Content-Type": "application/json"}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            response = await client.post(f"{base}/auth/v1/{path}", json=body, headers=headers)
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        return unavailable()
    if not isinstance(payload, dict):
        return unavailable()
    if response.status_code >= 400:
        return provider_failure(response.status_code, payload, action)
    return payload


def authenticated(payload: dict, email: str) -> JSONResponse:
    """提取用户与会话；令牌只发给内部 Next.js 代理，由代理保存 Cookie。"""
    user = payload.get("user")
    session = payload.get("session") if isinstance(payload.get("session"), dict) else payload
    if not isinstance(user, dict) or not isinstance(user.get("id"), str) or not user["id"]:
        return unavailable()
    access = session.get("access_token")
    refresh = session.get("refresh_token")
    if not isinstance(access, str) or not isinstance(refresh, str) or not access or not refresh:
        return unavailable()
    return reply(200, data={
        "status": "authenticated",
        "user": {"id": user["id"], "email": user["email"] if isinstance(user.get("email"), str) else email},
        "session": {"access_token": access, "refresh_token": refresh},
    })


# 各路由模块会引用上面的公共函数，因此在函数定义完成后再导入路由。
from .sign_up import router as sign_up_router  # noqa: E402
from .sign_in import router as sign_in_router  # noqa: E402
from .verify_email import router as verify_email_router  # noqa: E402
from .resend_code import router as resend_code_router  # noqa: E402

app.include_router(sign_up_router)
app.include_router(sign_in_router)
app.include_router(verify_email_router)
app.include_router(resend_code_router)
