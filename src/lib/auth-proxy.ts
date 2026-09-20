import "server-only";
import { createClient } from "./supabase/server";

type AuthAction = "sign-up" | "sign-in" | "verify-email" | "resend-code";

const headers = { "Cache-Control": "private, no-store" };

function failure(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers });
}

function authServiceUrl(action: AuthAction): URL | null {
  try {
    const url = new URL(process.env.AUTH_SERVICE_URL || "http://127.0.0.1:8000");
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    ) {
      return null;
    }
    url.pathname = `/${action}`;
    return url;
  } catch {
    return null;
  }
}

export async function proxyAuth(request: Request, action: AuthAction): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return failure(403, "INVALID_ORIGIN", "Use this site's registration form.");
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return failure(415, "UNSUPPORTED_MEDIA_TYPE", "Send a JSON request body.");
  }
  if (Number(request.headers.get("content-length")) > 4096) {
    return failure(413, "REQUEST_TOO_LARGE", "Request body is too large.");
  }

  let body: string;
  try {
    body = await request.text();
    if (new TextEncoder().encode(body).length > 4096) {
      return failure(413, "REQUEST_TOO_LARGE", "Request body is too large.");
    }
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return failure(400, "INVALID_INPUT", "Send an object with the required fields.");
    }
  } catch {
    return failure(400, "INVALID_INPUT", "Send valid JSON.");
  }

  const url = authServiceUrl(action);
  const token = process.env.AUTH_INTERNAL_TOKEN;
  if (!url || !token) {
    return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
  }

  let response: Response;
  let result: unknown;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Internal-Token": token },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    result = await response.json();
  } catch {
    return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
  }

  if (!result || typeof result !== "object") {
    return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
  }
  if (!response.ok) {
    const error = "error" in result ? result.error : null;
    if (error && typeof error === "object" && "code" in error && "message" in error) {
      return failure(response.status, String(error.code), String(error.message));
    }
    return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
  }

  const data = "data" in result ? result.data : null;
  if (!data || typeof data !== "object") {
    return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
  }
  if ("status" in data && data.status === "authenticated") {
    const session = "session" in data ? data.session : null;
    const user = "user" in data ? data.user : null;
    if (
      !session || typeof session !== "object" ||
      !("access_token" in session) || typeof session.access_token !== "string" ||
      !("refresh_token" in session) || typeof session.refresh_token !== "string" ||
      !user || typeof user !== "object" || !("id" in user) || typeof user.id !== "string"
    ) {
      return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
    }
    try {
      const supabase = await createClient();
      const { data: sessionData, error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (error || sessionData.user?.id !== user.id) {
        return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
      }
    } catch {
      return failure(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable.");
    }
    return Response.json({ data: { status: "authenticated", user } }, { status: response.status, headers });
  }
  return Response.json({ data }, { status: response.status, headers });
}
