"""重新发送注册确认验证码。"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .service import email_from, read_body, reply, supabase_post

router = APIRouter()


@router.post("/resend-code")
async def resend_code(request: Request) -> JSONResponse:
    """只需邮箱；发送频率限制由 Supabase 控制并映射为 RATE_LIMITED。"""
    body = await read_body(request)
    if isinstance(body, JSONResponse):
        return body
    email = email_from(body)
    if not email:
        return reply(400, code="INVALID_INPUT", message="Enter a valid email.")
    result = await supabase_post("resend", {"type": "signup", "email": email}, "resend-code")
    return result if isinstance(result, JSONResponse) else reply(202, data={"status": "sent"})
