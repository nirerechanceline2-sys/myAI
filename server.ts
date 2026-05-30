import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;

// Lazy initialization helper for Gemini SDK securely
let aiClient: GoogleGenAI | null = null;
let lastApiKey: string | undefined = undefined;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please navigate to the Settings > Secrets tab in Google AI Studio to configure your Gemini API Key.");
  }
  
  if (!aiClient || lastApiKey !== apiKey) {
    lastApiKey = apiKey;
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function cleanErrorMessage(error: any): string {
  if (!error) return "An internal error occurred during generation.";
  const msg = typeof error === "string" ? error : (error.message || "");
  
  if (msg.includes("GEMINI_API_KEY") || msg.includes("api_key") || msg.includes("API key")) {
    return "GEMINI_API_KEY environment variable is missing. Please declare your own key in the Settings > Secrets menu in AI Studio to continue messaging.";
  }
  
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded") || msg.includes("quota") || msg.includes("429") || msg.includes("Too Many Requests")) {
    return "The shared sandbox API quota has been temporarily exceeded (max 20 requests per day on the Gemini free tier limit). \n\nTo continue chatting immediately without any restrictions, please add your own personal **GEMINI_API_KEY** under the **Settings > Secrets** panel in the Google AI Studio top-right controls! This is fully free and takes less than 30 seconds.";
  }
  
  return msg || "An internal error occurred during generation.";
}

async function startServer() {
  const app = express();

  // Express JSON middleware with standard limits
  app.use(express.json({ limit: "10mb" }));

  // API HEALTH CHECK
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // AI CHAT EVENT-STREAM ENDPOINT
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, systemInstruction } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid request payload. 'messages' must be an array." });
        return;
      }

      // Check key and lazy-init
      const ai = getGeminiClient();

      // Format messages into GoogleGenAI standard contents array
      // Role mapping: 'assistant' -> 'model', 'user' -> 'user'
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }]
      }));

      // Establish Server-Sent Events headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders(); // push headers immediately

      // Use target model gemini-3.5-flash as per the model guideline for general text tasks
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemInstruction || "You are AI Assistant, a clean, minimal chatbot designed to strictly answer only the user's question directly, clearly, and concisely without extra greeting or chit-chat. Deliver elegant, factual responses.",
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Server-Side Chat error:", error);
      const errorMessage = cleanErrorMessage(error);
      
      // If headers haven't been sent yet, send a JSON error, otherwise push error chunk
      if (!res.headersSent) {
        res.status(500).json({ error: errorMessage });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  // AI TITLE GENERATOR ENDPOINT
  app.post("/api/generate-title", async (req, res) => {
    try {
      const { firstMessage } = req.body;
      if (!firstMessage) {
        res.status(400).json({ error: "firstMessage is required" });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a concise 2-4 word title for a conversation that starts with this message: "${firstMessage}". Return ONLY the generated title. Do not include quotes, markdown bold, bullet points, or extra text.`,
      });

      const title = response.text ? response.text.trim() : "New Chat";
      res.json({ title });
    } catch (error: any) {
      console.error("Generate Title error:", error);
      res.json({ title: "New Conversation" }); // Graceful fallback
    }
  });

  // AI IMAGE GENERATOR ENDPOINT
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio = "1:1" } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "prompt is required" });
        return;
      }

      const ai = getGeminiClient();
      console.log(`Generating image for prompt: "${prompt}" using aspectRatio: ${aspectRatio}`);

      let base64Image = "";
      let generatorSchemaUsed = "imagen";

      try {
        // Try high quality Imagen first
        const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
          },
        });

        if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
          base64Image = response.generatedImages[0].image.imageBytes;
        }
      } catch (err: any) {
        console.warn("Imagen high-quality fallback triggered. Trying gemini-2.5-flash-image:", err.message);
        try {
          // Try nano banana model
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: prompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio,
              }
            }
          });

          if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                base64Image = part.inlineData.data;
                generatorSchemaUsed = "flash-image";
                break;
              }
            }
          }
        } catch (innerErr: any) {
          console.error("All server-side Gemini image models failed:", innerErr);
          // Don't crash; let client know so it can render a magnificent fallback!
          res.json({
            success: false,
            error: cleanErrorMessage(innerErr),
            fallbackKeyword: prompt.slice(0, 30)
          });
          return;
        }
      }

      if (base64Image) {
        res.json({
          success: true,
          imageUrl: `data:image/jpeg;base64,${base64Image}`,
          schema: generatorSchemaUsed
        });
      } else {
        res.json({
          success: false,
          error: "No image bytes could be generated",
          fallbackKeyword: prompt.slice(0, 30)
        });
      }
    } catch (error: any) {
      console.error("General Generate Image failure:", error);
      res.status(500).json({ error: cleanErrorMessage(error) });
    }
  });

  // FRONTEND INTEGRATION
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware to act as modern HMR dev builder
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static asset serving from 'dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Chatbot full-stack environment listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
