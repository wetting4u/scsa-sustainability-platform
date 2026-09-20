"""邮箱密码登录接口。"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .service import authenticated, email_from, password_from, read_body, reply, supabase_post

router = APIRouter()


@router.post("/sign-in")
async def sign_in(request: Request) -> JSONResponse:
    """让 Supabase 校验密码，成功后把用户和会话交给内部 Next.js 代理。"""
    body = await read_body(request)
    if isinstance(body, JSONResponse):
        return body
    email = email_from(body)
    password = password_from(body)
    if not email or not password:
        return reply(400, code="INVALID_INPUT", message="Enter a valid email and password.")
    # 不在应用数据库中自行比对或保存明文密码。
    result = await supabase_post("token?grant_type=password", {"email": email, "password": password}, "sign-in")
    return result if isinstance(result, JSONResponse) else authenticated(result, email)
