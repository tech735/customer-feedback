// Admin login. The username and password come from the server's environment
// (ADMIN_USERNAME, ADMIN_PASSWORD; see .env.example), never from the code.
// A successful login sets a signed, httpOnly session cookie.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

export const SESSION_COOKIE = "kotu_admin";
const SESSION_HOURS = 8;
const MAX_FAILURES = 10;
const LOCKOUT_MS = 15 * 60 * 1000;

function config() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET) return null;
  return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, secret: SESSION_SECRET };
}

// Compare fixed-length digests so the comparison takes the same time
// whatever the input.
function sameText(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

// Including the password in the key means changing it signs everyone out.
function sign(value: string, cfg: NonNullable<ReturnType<typeof config>>) {
  return createHmac("sha256", cfg.secret + cfg.password).update(value).digest("base64url");
}

function isValidSession(token: string | undefined) {
  const cfg = config();
  if (!cfg || !token) return false;
  const [expires, signature] = token.split(".");
  return !!signature && Number(expires) > Date.now() && sameText(signature, sign(expires, cfg));
}

export async function isAdmin() {
  return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

// Failed sign-ins per client IP, kept in memory (reset when the server restarts).
const failures = new Map<string, { count: number; until: number }>();

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

export async function signIn(username: string, password: string): Promise<{ error?: string }> {
  const cfg = config();
  if (!cfg) {
    return { error: "Admin login is not set up yet: set ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET on the server." };
  }

  const ip = await clientIp();
  const record = failures.get(ip);
  if (record && record.until > Date.now() && record.count >= MAX_FAILURES) {
    return { error: "Too many failed attempts. Please try again in 15 minutes." };
  }

  // Check both so a wrong username takes as long as a wrong password.
  const userOk = sameText(username, cfg.username);
  const passOk = sameText(password, cfg.password);
  if (!userOk || !passOk) {
    const current = record && record.until > Date.now() ? record : { count: 0, until: Date.now() + LOCKOUT_MS };
    failures.set(ip, { count: current.count + 1, until: current.until });
    return { error: "Incorrect username or password." };
  }

  failures.delete(ip);
  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  (await cookies()).set(SESSION_COOKIE, `${expires}.${sign(expires, cfg)}`, {
    httpOnly: true,
    sameSite: "lax",
    // Set COOKIE_SECURE=false only if the site is served over plain HTTP.
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
  return {};
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
}
