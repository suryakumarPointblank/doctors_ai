export function reportClientError(message: string, context?: Record<string, unknown>, stack?: string) {
  try {
    void fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        stack,
        page: typeof window !== "undefined" ? window.location.pathname : undefined,
        context,
      }),
      keepalive: true,
    });
  } catch {
    // Reporting must never throw back into the caller.
  }
}
