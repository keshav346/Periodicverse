import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import https from "https";
import { simulateReaction } from "./src/lib/reactions";

let elementsData: any = null;

function fetchElementsData() {
  https.get("https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json", (res) => {
    let body = "";
    res.on("data", (chunk) => { body += chunk; });
    res.on("end", () => {
      try {
        elementsData = JSON.parse(body);
        console.log("Cached elements data.");
      } catch (e) {
        console.error("Error parsing elements data", e);
      }
    });
  }).on("error", (e) => {
    console.error("Error fetching elements data", e);
  });
}

async function startServer() {
  fetchElementsData();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/elements", (req, res) => {
    if (elementsData) {
      res.json(elementsData.elements);
    } else {
      res.status(503).json({ error: "Data not ready" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: key });
      
      const prompt = `You are PeriodicVerse AI, an advanced chemistry tutor.
Context about the current element or topic: ${context || "General Periodic Table"}
User message: ${message}

Answer the user concisely and accurately. Use simple terms when explaining complex concepts, but maintain scientific accuracy.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });

  app.post("/api/explain10", async (req, res) => {
    try {
      const { element } = req.body;
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: key });
      
      const prompt = `Explain the chemical element ${element} like I am 10 years old. Use fun analogies and keep it under 3 short paragraphs. Highlight its real-world usage.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });

  app.post("/api/react", async (req, res) => {
    try {
      const { elements, temperature, pressure, catalyst } = req.body;
      
      const result = simulateReaction(elements, temperature, pressure, catalyst);

      res.json(result);
    } catch (error) {
      console.error("Simulation Error:", error);
      res.status(500).json({ error: "Failed to simulate chemical reaction." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
