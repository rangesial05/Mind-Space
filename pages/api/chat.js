import { GoogleGenAI } from "@google/genai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ── Rate limiter: 100 messages per user per day ──
// Uses Upstash Redis (free tier covers this easily).
// If you haven't set up Upstash yet, see README.md.
let ratelimit;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "24 h"),
    analytics: true,
    prefix: "mindspace",
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Identify user by IP (or a session token if you add auth later) ──
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "anonymous";

  // ── Rate limit check ──
  if (ratelimit) {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      const resetDate = new Date(reset);
      const resetTime = resetDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      });
      return res.status(429).json({
        error: "rate_limited",
        message: `You've reached the 100 message daily limit. You can chat again after ${resetTime} IST.`,
        remaining: 0,
        reset,
      });
    }

    // Warn user when getting close
    if (remaining <= 10) {
      res.setHeader("X-RateLimit-Warning", `${remaining} messages left today`);
    }
  }

  const { messages, system } = req.body;

  // ── Basic validation ──
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }
  if (!system || typeof system !== "string") {
    return res.status(400).json({ error: "system prompt is required" });
  }
  if (messages.length > 200) {
    return res.status(400).json({ error: "conversation too long" });
  }

  // ── Sanitize messages (only allow role + content strings) ──
  const sanitized = messages
    .filter((m) => m.role && typeof m.content === "string")
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content.slice(0, 4000), // cap each message
    }));

  const prompt = `
System Instructions:
${system}

Conversation:
${sanitized
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}
`;
    try {
    const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});

    return res.status(200).json({
  content: [
    {
      text: response.text,
    },
  ],
  remaining: ratelimit
    ? parseInt(res.getHeader("X-RateLimit-Remaining") || "100")
    : null,
});
  } catch (err) {
    console.error("Gemini API error:", err);
    if (err.status === 429) {
      return res.status(503).json({ error: "AI service busy, please retry in a moment." });
    }
    return res.status(500).json({ error: "Something went wrong on our end." });
  }
}
