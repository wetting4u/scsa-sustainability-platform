# Backend 变更记录

本文件记录 `backend` 分支上 BE-01 认证相关的改动。以后每次修改代码或配置时，在末尾追加日期、改动内容、涉及文件和验证结果。以下历史根据工作区及本次对话整理；最新提交状态以 Git 为准。

## 2026-09-20：建立认证接口初稿

- 新建 `backend/auth/service.ts`，实现邮箱密码注册、登录、邮箱验证码验证、重发验证码，调用 Supabase Auth。注册需要邮箱确认，登录成功返回用户信息并通过 Supabase SSR 保存会话。
- 新建 `src/app/api/auth/sign-up/route.ts`、`sign-in/route.ts`、`verify-email/route.ts`、`resend-code/route.ts`，提供 Next.js 的四个 POST 接口。
- 新建 `src/features/auth/client.ts`，供前端调用上述接口，并定义请求、响应和错误类型。当前页面尚未接入登录表单。
- 这些文件最初均未提交；后续 Python 迁移替换了 TypeScript 后端服务，保留了前端调用文件和四个 Next.js 路由入口。

## 2026-09-20：安装并验证 Next.js 开发环境

- 在用户目录安装 Node.js `24.21.0`、npm `11.19.0`、pnpm `12.5.1`；按 `pnpm-lock.yaml` 安装项目依赖。`node_modules/` 已被 Git 忽略。
- `pnpm run typecheck` 与 `pnpm run build` 通过。运行 `pnpm dev` 后，`http://localhost:3000` 跳转到 `/overview`，页面返回 HTTP 200。
- 验证后停止服务，清理 Next.js 自动生成的 `AGENTS.md` 和 `CLAUDE.md`，并恢复 `next-env.d.ts`；这些验证步骤没有留下额外的源码改动。

## 2026-09-20：将五项后端代码迁移到 Python

- 删除 `backend/auth/service.ts`，新建 `backend/auth/service.py` 以及 `sign_up.py`、`sign_in.py`、`verify_email.py`、`resend_code.py`。Python 服务负责输入校验、调用 Supabase Auth、映射错误和返回认证结果。
- 新建 `backend/auth/requirements.txt`，固定 FastAPI、HTTPX、python-dotenv、Uvicorn 的已验证版本。在用户目录安装 Python `3.14.7` 和这些依赖。
- 新建 `src/lib/auth-proxy.ts`，修改四个 `src/app/api/auth/*/route.ts` 为 Next.js 转发入口。前端仍请求原来的 `/api/auth/*` 地址；登录或验证码验证成功后，Next.js 保存 Supabase 会话，只把状态和用户信息返回前端，不把令牌放入响应正文。
- `src/features/auth/client.ts` 保持 TypeScript，迁移时未修改。修改 `.env.example`，增加 `AUTH_SERVICE_URL` 和 `AUTH_INTERNAL_TOKEN` 示例；修改根目录 `README.md`，说明 Python 服务配置与双服务启动步骤。
- 验证：Python 四条接口通过本地模拟 Supabase 测试；错误密码返回 401，缺少内部令牌返回 403。Next.js 与 Python 本地联调中，注册返回 202，登录和验证码验证返回 200 并设置会话 Cookie，重发返回 202；响应正文不包含访问令牌。TypeScript 检查和 Next.js 构建通过。
- 待验收：仓库没有 `.env.local`，尚未用真实 Supabase 项目测试邮件发送与验证码。负责 Supabase 的同事需提供 URL 和 publishable key，启用邮箱确认，并在注册确认邮件模板中使用 `{{ .Token }}`。部署时还需单独运行 Python 服务并配置其 HTTPS 地址。

## 2026-09-20：建立本变更记录

- 新建 `backend/edit.md`，集中记录上述改动和后续每次修改。未创建 `.env.local`，未提交或推送代码。

## 2026-09-20：准备前端认证交接文档

- 新建 `backend/frontend-auth-pages.md`，列出登录、注册、邮箱验证码页面的交互、入口和验收要求，并说明现有演示页面还未加登录保护。
- 新建 `backend/auth-api-for-frontend.md`，列出四个同域认证接口的请求体、成功响应、错误码、会话行为和本地联调条件。
- 文档内容已与当前 `src/features/auth/client.ts`、四个 `route.ts`、Python 服务和 `.env.example` 对照；未修改前端或后端业务代码。

## 2026-09-20：为认证代码补充说明注释

- 在五个 `backend/auth/*.py` 文件中补充模块与函数说明，解释内部请求密钥、输入校验、Supabase 错误映射、会话令牌传递及四个认证流程。
- 在 `src/features/auth/client.ts` 中补充用户类型、错误处理、同域请求和 `authApi` 调用顺序的注释。
- 本次只增加注释，不改变接口、请求处理或返回结果；随后运行 Python 模块导入检查和 TypeScript 类型检查。
