"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientLogger";

export default function ClientErrorLogger() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.message || "Uncaught error", { source: "window.onerror" }, event.error?.stack);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      reportClientError(message, { source: "unhandledrejection" }, reason instanceof Error ? reason.stack : undefined);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
