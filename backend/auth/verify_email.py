"""校验用户在注册页面输入的邮箱验证码。"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .service import authenticated, code_from, email_from, read_body, reply, supabase_post

router = APIRouter()


@router.post("/verify-email")
async def verify_email(request: Request) -> JSONResponse:
    """验证码由 Supabase 判断有效性；成功时同时建立登录会话。"""
    body = await read_body(request)
    if isinstance(body, JSONResponse):
        return body
    email = email_from(body)
    code = code_from(body)
    if not email or not code:
        return reply(400, code="INVALID_INPUT", message="Enter your email and the code from the email.")
    # type=email 对应注册确认邮件中的数字验证码，而非点击邮件链接。
    result = await supabase_post("verify", {"email": email, "token": code, "type": "email"}, "verify-email")
    return result if isinstance(result, JSONResponse) else authenticated(result, email)
