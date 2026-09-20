# 前后端认证 API 约定

浏览器调用本项目的 Next.js 同域接口；Next.js 将请求转给 Python 认证服务，并在认证成功后保存会话。前端优先使用 `src/features/auth/client.ts` 的 `authApi`，不要直接调用 Python 服务或 Supabase Auth URL。

## 接口总览

所有请求均为 `POST`，请求体为 JSON，头部 `Content-Type: application/json`。浏览器从当前站点发起同域请求；`authApi` 已设置 `credentials: "same-origin"`。请求体上限为 4096 字节。

| 操作 | 浏览器请求路径 | 请求体 | 成功 HTTP 状态 |
| --- | --- | --- | --- |
| 注册 | `/api/auth/sign-up` | `{ "email": string, "password": string }` | 202 |
| 输入邮箱验证码 | `/api/auth/verify-email` | `{ "email": string, "code": string }` | 200 |
| 重发注册验证码 | `/api/auth/resend-code` | `{ "email": string }` | 202 |
| 邮箱密码登录 | `/api/auth/sign-in` | `{ "email": string, "password": string }` | 200 |

邮箱会在后端去除首尾空格并转成小写。密码长度为 6–1024 个字符；验证码必须是 4–10 位数字字符串。页面最好也做同样的基本校验，但以后端响应为准。

## 成功响应

### 注册：`authApi.signUp({ email, password })`

```json
{
  "data": {
    "status": "verification_required",
    "email": "user@example.com"
  }
}
```

HTTP 202 表示进入邮箱验证码步骤，**尚未登录**。请保留返回的邮箱供验证及重发使用。

### 验证邮箱：`authApi.verifyEmail({ email, code })`

```json
{
  "data": {
    "status": "authenticated",
    "user": { "id": "<Supabase 用户 ID>", "email": "user@example.com" }
  }
}
```

HTTP 200 表示验证成功并建立登录会话。

### 重发验证码：`authApi.resendCode(email)`

```json
{ "data": { "status": "sent" } }
```

HTTP 202 表示重发请求已接受；可能受 Supabase 频率限制。

### 登录：`authApi.signIn({ email, password })`

```json
{
  "data": {
    "status": "authenticated",
    "user": { "id": "<Supabase 用户 ID>", "email": "user@example.com" }
  }
}
```

HTTP 200 表示登录成功。验证码验证和登录成功时，Next.js 保存会话 Cookie；响应正文不包含访问令牌或刷新令牌。页面可据此跳转，但不要把返回的 `user.id` 当作以后 API 请求的身份凭据。

## 错误响应

失败统一返回：

```json
{
  "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." }
}
```

`authApi` 会把错误转换成 `AuthApiError`，提供 `code`、`status`、`message`。主要错误码如下：

| HTTP | `code` | 前端建议 |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | 提示检查邮箱、密码或验证码格式 |
| 400 | `WEAK_PASSWORD` | 提示换更强的密码 |
| 400 | `INVALID_OR_EXPIRED_CODE` | 提示验证码错误或过期，并提供重发入口 |
| 401 | `INVALID_CREDENTIALS` | 提示邮箱或密码不正确 |
| 403 | `EMAIL_NOT_CONFIRMED` | 引导完成邮箱验证码步骤 |
| 409 | `EMAIL_ALREADY_REGISTERED` | 提示改为登录 |
| 429 | `RATE_LIMITED` | 提示稍后重试，避免立即重复发送 |
| 503 | `AUTH_UNAVAILABLE` | 提示服务暂时不可用 |
| 503 | `AUTH_CONFIGURATION_ERROR` | 注册时邮箱确认未配置；交给后端处理 |

请求来源不正确会返回 `403 INVALID_ORIGIN`；媒体类型不正确会返回 `415 UNSUPPORTED_MEDIA_TYPE`；请求体过大返回 `413 REQUEST_TOO_LARGE`。注册和重发还可能分别返回 `400 SIGN_UP_FAILED`、`400 RESEND_FAILED`。界面应对未列出的错误提供通用提示。

## 本地联调条件与当前范围

- 在项目根目录分别运行 Python 服务和 Next.js。启动命令与配置说明见根目录 `README.md` 的“Python 认证服务（BE-01）”一节。
- `.env.local` 需配置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`AUTH_SERVICE_URL` 和 `AUTH_INTERNAL_TOKEN`。浏览器代码不应读取或发送 `AUTH_INTERNAL_TOKEN`。
- Supabase 需启用邮箱确认，并让注册确认邮件模板显示 `{{ .Token }}`；否则无法完成页面输入验证码的真实流程。
- 目前没有查询当前登录用户、退出登录或受保护页面的接口。上述四项 API 已通过本地模拟 Supabase 联调，真实邮件与真实 Supabase 项目仍待验收。
