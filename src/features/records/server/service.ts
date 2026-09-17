import "server-only";

// Replace only after authentication, validation, repository and RLS are ready.
export function recordsNotConfigured() {
  return Response.json(
    {
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Persistent records are not enabled. Use the demo interface.",
      },
    },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
