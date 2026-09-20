"use client";

/** 前端只拿到用户 ID 和邮箱；真实身份由服务端会话判断。 */
export type AuthUser = { id: string; email: string };
export type Credentials = { email: string; password: string };
export type Verification = { email: string; code: string };
export type VerificationRequired = {
  status: "verification_required";
  email: string;
};
export type Authenticated = {
  status: "authenticated";
  user: AuthUser;
};
export type CodeSent = { status: "sent" };

/** 让表单能根据 HTTP 状态和稳定错误码显示合适的提示。 */
export class AuthApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function post<T>(path: string, body: object): Promise<T> {
  // 浏览器只请求本站 Next.js 接口，不直接访问 Python 服务或 Supabase。
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin", // 让浏览器随请求携带本站的会话 Cookie。
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    // 后端错误格式为 { error: { code, message } }；缺失时给统一错误。
    const error =
      result && typeof result === "object" && "error" in result
        ? result.error
        : null;
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error
    ) {
      throw new AuthApiError(
        String(error.code),
        response.status,
        String(error.message),
      );
    }
    throw new AuthApiError(
      "REQUEST_FAILED",
      response.status,
      "Authentication request failed.",
    );
  }
  if (!result || typeof result !== "object" || !("data" in result)) {
    throw new AuthApiError(
      "INVALID_RESPONSE",
      response.status,
      "Authentication response was invalid.",
    );
  }
  // 成功格式为 { data: ... }；这里只返回 data，页面不必处理外层包装。
  return result.data as T;
}

/** 注册 → 输入验证码 → 验证/重发；已有账号直接登录。 */
export const authApi = {
  signUp: (credentials: Credentials) =>
    post<VerificationRequired>("/api/auth/sign-up", credentials),
  verifyEmail: (verification: Verification) =>
    post<Authenticated>("/api/auth/verify-email", verification),
  resendCode: (email: string) =>
    post<CodeSent>("/api/auth/resend-code", { email }),
  signIn: (credentials: Credentials) =>
    post<Authenticated>("/api/auth/sign-in", credentials),
};
