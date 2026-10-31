import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  verifyUser,
  verifyPassword,
  login,
  logoutUser,
  terminateSessions,
  getTimetable,
  getAttendance,
  getMarks,
  getUserInfo,
  getCalendar,
  getDayOrder,
  getCourse,
  getAllData,
  resetUrlCache,
} from "reddy-api-srm";

const PORT = Number(process.env.PORT) || 5000;
// Private by default: loopback only. Set HOST explicitly (e.g. 0.0.0.0 inside a container
// whose published port is the boundary) only when you understand who can reach the port.
const HOST = process.env.HOST?.trim() || "127.0.0.1";

const allowedOrigins = (process.env.CORS_ORIGIN?.trim() || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const app = express();
app.disable("x-powered-by");

// Number of reverse-proxy hops to trust for req.ip (needed for correct rate limiting behind a proxy).
const trustProxy = Number(process.env.TRUST_PROXY);
if (Number.isInteger(trustProxy) && trustProxy > 0) app.set("trust proxy", trustProxy);

/** Log a failure server-side without ever printing request bodies, passwords or cookies. */
function logError(where: string, e: unknown): void {
  const msg = e instanceof Error ? `${e.name}: ${e.message}` : "non-Error thrown";
  console.error(`[${new Date().toISOString()}] ${where} failed: ${msg}`);
}

// Basic security headers (API only returns JSON; responses carry personal data, so never cache).
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Reject browser requests from origins that are not allowlisted (requests with no Origin header,
// e.g. curl or server-to-server calls, are not subject to CORS and pass through).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin !== undefined && !allowedOrigins.includes(origin)) {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }
  next();
});
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));

/** Tiny fixed-window in-memory rate limiter, keyed by client IP. */
function rateLimit(opts: { windowMs: number; max: number }): express.RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, opts.windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > opts.max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ error: "Too many attempts. Please try again later." });
      return;
    }
    next();
  };
}

// Credential-handling endpoints: limit to blunt brute-forcing (15 requests / 15 min / IP).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });
app.use(["/srm/full-login", "/srm/verify-user", "/srm/verify-password"], authLimiter);

type Handler = (req: express.Request, res: express.Response) => unknown | Promise<unknown>;

/** Wrap a handler: any thrown error is logged server-side and a generic 500 is returned. */
function route(name: string, handler: Handler): express.RequestHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      logError(name, e);
      if (!res.headersSent) res.status(500).json({ error: "Internal error" });
    }
  };
}

/** POST route that requires `{ cookies: string }` and responds with fn(cookies) as JSON. */
function cookieRoute(name: string, fn: (cookies: string) => Promise<unknown>): void {
  app.post(
    `/srm/${name}`,
    route(name, async (req, res) => {
      const cookies = typeof req.body?.cookies === "string" ? req.body.cookies : "";
      if (!cookies.trim()) {
        res.status(400).json({ error: "cookies is required" });
        return;
      }
      res.json(await fn(cookies));
    })
  );
}

app.get("/", (_req, res) => {
  res.json({
    name: "srm-toolkit-api",
    cors: "allowlist (CORS_ORIGIN env); other browser origins are rejected",
    endpoints: {
      "GET /health": "Liveness check",
      "POST /srm/verify-user": "{ username }",
      "POST /srm/verify-password": "{ identifier, digest, password }",
      "POST /srm/full-login": "{ email, password, maxRetries? }",
      "POST /srm/logout": "{ cookies }",
      "POST /srm/terminate-sessions": "{ flowId, identifier, digest, csrfToken?, sessionCookie? }",
      "POST /srm/dashboard": "{ cookies } → getAllData",
      "POST /srm/timetable": "{ cookies }",
      "POST /srm/attendance": "{ cookies }",
      "POST /srm/marks": "{ cookies }",
      "POST /srm/user-info": "{ cookies }",
      "POST /srm/calendar": "{ cookies }",
      "POST /srm/day-order": "{ cookies }",
      "POST /srm/course": "{ cookies }",
      "POST /srm/reset-url-cache": "{} (no body) — clears cached portal URLs",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.post(
  "/srm/verify-user",
  route("verify-user", async (req, res) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    if (!username) {
      res.status(400).json({ error: "username is required" });
      return;
    }
    res.json(await verifyUser(username));
  })
);

app.post(
  "/srm/verify-password",
  route("verify-password", async (req, res) => {
    const identifier = typeof req.body?.identifier === "string" ? req.body.identifier : "";
    const digest = typeof req.body?.digest === "string" ? req.body.digest : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!identifier || !digest || !password) {
      res.status(400).json({ error: "identifier, digest, and password are required" });
      return;
    }
    res.json(await verifyPassword({ identifier, digest, password }));
  })
);

app.post(
  "/srm/full-login",
  route("full-login", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const maxRetries =
      typeof req.body?.maxRetries === "number" && Number.isFinite(req.body.maxRetries)
        ? req.body.maxRetries
        : undefined;
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    res.json(await login(email, password, maxRetries));
  })
);

app.post(
  "/srm/terminate-sessions",
  route("terminate-sessions", async (req, res) => {
    const flowRaw = req.body?.flowId;
    const flowId: string | null = typeof flowRaw === "string" ? flowRaw : null;
    const identifier = typeof req.body?.identifier === "string" ? req.body.identifier : "";
    const digest = typeof req.body?.digest === "string" ? req.body.digest : "";
    if (!identifier || !digest) {
      res.status(400).json({ error: "identifier and digest are required (flowId may be null)" });
      return;
    }
    res.json(
      await terminateSessions({
        flowId,
        identifier,
        digest,
        csrfToken: typeof req.body?.csrfToken === "string" ? req.body.csrfToken : undefined,
        sessionCookie: typeof req.body?.sessionCookie === "string" ? req.body.sessionCookie : undefined,
      })
    );
  })
);

cookieRoute("logout", logoutUser);
cookieRoute("dashboard", getAllData);
cookieRoute("timetable", getTimetable);
cookieRoute("attendance", getAttendance);
cookieRoute("marks", getMarks);
cookieRoute("user-info", getUserInfo);
cookieRoute("calendar", getCalendar);
cookieRoute("day-order", getDayOrder);
cookieRoute("course", getCourse);

app.post(
  "/srm/reset-url-cache",
  route("reset-url-cache", (_req, res) => {
    resetUrlCache();
    res.json({ ok: true });
  })
);

// 404 for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler: malformed/oversized JSON bodies and anything unexpected. Never echo error details.
// Express identifies error handlers by their 4-argument arity, so `_next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const type = (err as { type?: string } | null)?.type;
  if (type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  if (type === "entity.too.large") {
    res.status(413).json({ error: "Request body too large" });
    return;
  }
  logError("request", err);
  if (!res.headersSent) res.status(500).json({ error: "Internal error" });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`srm-toolkit-api listening on http://${HOST}:${PORT}`);
  console.log(`CORS allowlist: ${allowedOrigins.join(", ")}`);
  if (!["127.0.0.1", "::1", "localhost"].includes(HOST)) {
    console.warn(
      `WARNING: HOST=${HOST} is not loopback; this API proxies student logins and has no auth of its own. Only do this behind a private network or trusted proxy.`
    );
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set PORT in backend/.env (e.g. PORT=5001) and match NEXT_PUBLIC_SRM_API_BASE on the frontend.`
    );
    process.exit(1);
  }
  logError("server", err);
  process.exit(1);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  server.closeIdleConnections?.();
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
