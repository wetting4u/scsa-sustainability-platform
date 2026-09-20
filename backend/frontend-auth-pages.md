# 前端任务：注册、验证码和登录页面

给负责 Next.js 前端的同事。当前 `backend` 分支只有认证 API 与浏览器调用工具，**没有注册或登录页面**。请在现有 App Router 项目中完成以下界面，沿用项目现有的视觉样式和响应式布局。

## 需要制作的流程

| 页面或步骤 | 建议路径 | 用户操作 | 成功后 |
| --- | --- | --- | --- |
| 登录 | `/sign-in` | 输入邮箱、密码，点击登录；提供“创建账号”入口 | 调用 `authApi.signIn`，显示成功后进入 `/overview` |
| 注册 | `/sign-up` | 输入邮箱、密码，提交注册 | 调用 `authApi.signUp`；收到 `verification_required` 后进入验证码步骤 |
| 邮箱验证码 | `/verify-email` 或注册页的第二步 | 输入邮箱收到的数字验证码；可重发 | 调用 `authApi.verifyEmail`；成功后进入 `/overview` |

邮箱验证方式是**在页面输入邮件里的验证码**，不要求用户点击确认链接。验证码输入框需要保留注册邮箱，让用户能检查或修改邮箱。验证码过期时允许重新发送。

## 可直接使用的前端工具

使用 `src/features/auth/client.ts` 导出的 `authApi`，它已经调用同域 `/api/auth/*`。前端无需直接请求 Supabase，也无需直接访问 Python 服务端口。

```ts
import { authApi, AuthApiError } from "@/features/auth/client";

const next = await authApi.signUp({ email, password });
// next.status === "verification_required"；转到验证码步骤。

const verified = await authApi.verifyEmail({ email: next.email, code });
// verified.status === "authenticated"；可 router.push("/overview")。

await authApi.resendCode(email);

const signedIn = await authApi.signIn({ email, password });
// signedIn.user 包含 id 和 email；可 router.push("/overview")。
```

请在提交期间禁用按钮并显示加载状态；用 `try/catch` 捕获 `AuthApiError`，在表单附近展示可理解的错误提示。密码至少 6 个字符；验证码只接受 4–10 位数字。不要把密码、验证码或用户令牌写入 URL、浏览器本地存储或日志。

## 页面接入注意

- 当前 `/` 会直接跳转 `/overview`，现有导航没有登录或注册入口。新增页面后，请安排用户能发现的入口；是否把首页改成登录页，需要与前端负责人统一。
- 当前 `/overview` 等页面仍是免登录演示页，`src/app/(household)/layout.tsx` 没有登录保护。制作表单不会自动保护这些页面。
- 当前后端只提供注册、验证码验证、重发验证码和登录四项接口。还没有“查询当前用户”和“退出登录”的页面接口；若界面需要刷新后显示登录身份或提供退出按钮，请先和后端约定新增接口。
- 登录成功或邮箱验证成功时，Next.js 服务端会保存 Supabase 会话。前端只需处理返回的状态和 `user`，不要自行管理访问令牌。

## 验收要点

1. 用户能从登录页进入注册流程，注册后看到验证码输入步骤。
2. 正确验证码完成验证并跳转 `/overview`；错误或过期验证码有明确提示，可重发。
3. 正确邮箱和密码能登录并跳转；错误密码和未确认邮箱有不同提示。
4. 请求中显示加载状态，避免重复提交；错误后保留邮箱输入。
5. 在桌面和手机宽度下可以完成整个流程，键盘可以操作所有表单控件。

具体请求、响应和错误码见 [前后端认证 API 约定](auth-api-for-frontend.md)。真实邮件联调取决于 Supabase 配置完成。
