import { getDatabase } from "@/lib/mongodb";

const LOG_COLLECTION = process.env.MONGODB_LOG_COLLECTION || "doctor_ai_logs";

export type LogLevel = "info" | "error";

export interface LogEntry {
  level: LogLevel;
  route: string;
  message: string;
  details?: Record<string, unknown> | null;
  error?: string;
  createdAt: Date;
}

async function saveLog(entry: LogEntry) {
  try {
    const db = await getDatabase();
    await db.collection(LOG_COLLECTION).insertOne(entry);
  } catch (err) {
    // Logging must never break the request it's logging for.
    console.error("Failed to persist log entry:", err);
  }
}

export function logInfo(route: string, message: string, details?: Record<string, unknown>) {
  console.log(`[${route}] ${message}`, details ?? "");
  void saveLog({ level: "info", route, message, details, createdAt: new Date() });
}

export function logError(route: string, message: string, err: unknown, details?: Record<string, unknown>) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error(`[${route}] ${message}:`, err);
  void saveLog({
    level: "error",
    route,
    message,
    details,
    error: errorMessage,
    createdAt: new Date(),
  });
}
