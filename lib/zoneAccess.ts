import { ZONES } from "./constants";

function parseZoneTokens(): Record<string, string> {
  const raw = process.env.ZONE_ACCESS_TOKENS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function zoneForToken(token: string): string | null {
  if (!token) return null;
  const tokens = parseZoneTokens();
  const zone = ZONES.find((z) => tokens[z] === token);
  return zone ?? null;
}
