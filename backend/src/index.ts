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

const app = express();
app.use(express.json({ limit: "1mb" }));

// Allow browser requests from any origin (reflects Origin; not an allowlist)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

function requireCookies(body: Record<string, unknown>): string | null {
  const cookies = typeof body.cookies === "string" ? body.cookies : "";
  return cookies.trim() ? cookies : null;
}

app.get("/", (_req, res) => {
  res.json({
    name: "srm-toolkit-api",
    cors: "permissive (any Origin)",
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

app.post("/srm/verify-user", async (req, res) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    if (!username) {
      res.status(400).json({ error: "username is required" });
      return;
    }
    const result = await verifyUser(username);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/verify-password", async (req, res) => {
  try {
    const identifier = typeof req.body?.identifier === "string" ? req.body.identifier : "";
    const digest = typeof req.body?.digest === "string" ? req.body.digest : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!identifier || !digest || !password) {
      res.status(400).json({ error: "identifier, digest, and password are required" });
      return;
    }
    const result = await verifyPassword({ identifier, digest, password });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/full-login", async (req, res) => {
  try {
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
    const result = await login(email, password, maxRetries);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/logout", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    const result = await logoutUser(cookies);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/terminate-sessions", async (req, res) => {
  try {
    const flowRaw = req.body?.flowId;
    const flowId: string | null =
      flowRaw === null || flowRaw === undefined
        ? null
        : typeof flowRaw === "string"
          ? flowRaw
          : null;
    const identifier = typeof req.body?.identifier === "string" ? req.body.identifier : "";
    const digest = typeof req.body?.digest === "string" ? req.body.digest : "";
    if (!identifier || !digest) {
      res.status(400).json({ error: "identifier and digest are required (flowId may be null)" });
      return;
    }
    const result = await terminateSessions({
      flowId,
      identifier,
      digest,
      csrfToken: typeof req.body?.csrfToken === "string" ? req.body.csrfToken : undefined,
      sessionCookie: typeof req.body?.sessionCookie === "string" ? req.body.sessionCookie : undefined,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/dashboard", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    const data = await getAllData(cookies);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/timetable", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    res.json(await getTimetable(cookies));
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/attendance", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    res.json(await getAttendance(cookies));
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/marks", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    res.json(await getMarks(cookies));
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/user-info", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    res.json(await getUserInfo(cookies));
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/calendar", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    res.json(await getCalendar(cookies));
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/day-order", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    res.json(await getDayOrder(cookies));
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/course", async (req, res) => {
  try {
    const cookies = requireCookies(req.body);
    if (!cookies) {
      res.status(400).json({ error: "cookies is required" });
      return;
    }
    res.json(await getCourse(cookies));
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

app.post("/srm/reset-url-cache", (_req, res) => {
  try {
    resetUrlCache();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Internal error", detail: String(e) });
  }
});

const server = app.listen(PORT, () => {
  console.log(`srm-toolkit-api listening on http://localhost:${PORT}`);
  console.log("CORS: permissive (any browser Origin)");
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set PORT in backend/.env (e.g. PORT=5001) and match NEXT_PUBLIC_SRM_API_BASE on the frontend.`
    );
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
