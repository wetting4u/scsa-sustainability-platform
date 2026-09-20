"""邮箱密码注册：提交后等待用户输入邮件中的验证码。"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .service import email_from, password_from, read_body, reply, supabase_post, unavailable

router = APIRouter()


@router.post("/sign-up")
async def sign_up(request: Request) -> JSONResponse:
    """注册成功只返回待验证状态，不在此时建立登录会话。"""
    body = await read_body(request)
    if isinstance(body, JSONResponse):
        return body
    email = email_from(body)
    password = password_from(body)
    if not email or not password:
        return reply(400, code="INVALID_INPUT", message="Enter a valid email and a password of at least 6 characters.")
    result = await supabase_post("signup", {"email": email, "password": password}, "sign-up")
    if isinstance(result, JSONResponse):
        return result
    if not isinstance(result.get("user"), dict):
        return unavailable()
    if result.get("access_token") or result.get("session"):
        # Supabase 若立刻发来会话，说明邮箱确认未启用；拒绝这次流程。
        token = result.get("access_token")
        if isinstance(token, str) and token:
            await supabase_post("logout?scope=local", {}, "sign-up", access_token=token)
        return reply(503, code="AUTH_CONFIGURATION_ERROR", message="Email confirmation is not configured.")
    return reply(202, data={"status": "verification_required", "email": email})
