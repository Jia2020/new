import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests with large payloads (for base64 audio)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client server-side lazily
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY environment variable is missing.");
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// In-memory Cloud Accounts & Synced Data store (server-side persistence)
interface CloudRecord {
  id: string;
  title: string;
  text: string;
  audioDataUrl?: string; // Base64 audio if present
  duration: number;
  language: string;
  createdAt: number;
  mode: "mic" | "file";
}

interface UserAccount {
  email: string;
  records: CloudRecord[];
  updatedAt: number;
}

const cloudDatabase: Record<string, UserAccount> = {
  "demo@cloud.com": {
    email: "demo@cloud.com",
    updatedAt: Date.now(),
    records: [
      {
        id: "sample-1",
        title: "多语言混合会议纪要示例",
        text: "Bonjour tout le monde! 今天我们的项目讨论主要有三个 points。First, speech recognition latency must be under 500 milliseconds. 第二，我们需要支持智能停顿断句和自动标点，这样能极大提升记录的阅读体验。Merci pour votre attention!",
        duration: 18,
        language: "mixed",
        createdAt: Date.now() - 3600000,
        mode: "file",
      },
    ],
  },
};

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: AI Audio Transcription (for uploaded audio files or record fallback)
app.post("/api/transcribe-audio", async (req, res) => {
  try {
    const { base64Audio, mimeType, language } = req.body;

    if (!base64Audio) {
      return res.status(400).json({ error: "Missing base64Audio data" });
    }

    const ai = getGenAI();
    const effectiveMimeType = mimeType || "audio/webm";

    const prompt = `You are an expert multilingual speech-to-text transcriber. 
Transcribe the provided audio clip into accurate text.
Language context hint: ${language || "Multilingual (Chinese, English, French, mixed)"}.

Requirements:
1. Accurately capture words in Chinese (中文), English, French (Français), or mixed spoken code-switching.
2. Automatically insert correct punctuation (commas, periods, question marks, exclamation marks, line breaks at natural pauses).
3. Do NOT add extra conversational fluff, intro text, or disclaimer. Output ONLY the transcribed text.
4. Keep original word order and tone faithful to the speaker.`;

    const audioPart = {
      inlineData: {
        data: base64Audio.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, ""),
        mimeType: effectiveMimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [audioPart, { text: prompt }],
      },
    });

    const transcribedText = response.text || "";
    return res.json({ text: transcribedText });
  } catch (err: any) {
    console.error("Audio transcription error:", err);
    return res.status(500).json({
      error: "Transcription failed: " + (err?.message || "Unknown server error"),
    });
  }
});

// Endpoint: Smart Pause Auto-Punctuation & Formatting Refinement
app.post("/api/refine-text", async (req, res) => {
  try {
    const { rawText, mode, targetLang } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Invalid rawText provided" });
    }

    const ai = getGenAI();

    let prompt = "";
    if (mode === "translate" && targetLang) {
      prompt = `Translate the following speech transcript into ${targetLang}. Maintain clean formatting and proper punctuation:\n\n"${rawText}"`;
    } else {
      prompt = `You are an intelligent speech formatting assistant.
Take the following raw continuous speech transcript and perform smart auto-punctuation and paragraph formatting:
1. Automatically insert punctuation (?, ., ,, !, spaces) where pauses and sentence boundaries occur naturally.
2. Fix minor speech repetition typos while preserving the original meaning and words.
3. Support Chinese, English, French, and mixed language text seamlessly.
4. Return ONLY the refined text without meta commentary.

Raw Transcript:
"${rawText}"`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({ text: response.text || rawText });
  } catch (err: any) {
    console.error("Refine text error:", err);
    return res.status(500).json({ error: "Failed to refine text" });
  }
});

// Cloud Sync Endpoints
app.post("/api/cloud/auth", (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  let user = cloudDatabase[email];
  if (!user) {
    user = {
      email,
      records: [],
      updatedAt: Date.now(),
    };
    cloudDatabase[email] = user;
  }

  return res.json({
    email: user.email,
    records: user.records,
    lastSyncedAt: user.updatedAt,
  });
});

app.post("/api/cloud/sync", (req, res) => {
  const { email, records } = req.body;
  if (!email || !cloudDatabase[email]) {
    return res.status(401).json({ error: "Cloud account not authenticated" });
  }

  cloudDatabase[email].records = records || [];
  cloudDatabase[email].updatedAt = Date.now();

  return res.json({
    success: true,
    lastSyncedAt: cloudDatabase[email].updatedAt,
    count: cloudDatabase[email].records.length,
  });
});

// Start Server and mount Vite
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
