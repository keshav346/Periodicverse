import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import https from "https";
import { simulateReaction } from "./src/lib/reactions";

let elementsData: any = null;

function fetchElementsData() {
  https
    .get(
      "https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json",
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            elementsData = JSON.parse(body);
            console.log("Cached elements data.");
          } catch (e) {
            console.error("Error parsing elements data", e);
          }
        });
      },
    )
    .on("error", (e) => {
      console.error("Error fetching elements data", e);
    });
}

async function generateWithFallback(
  prompt: string,
  context?: string,
  imageBase64?: string,
  aiModel?: string,
): Promise<{ text: string; reasoning?: string }> {
  const tryMimo = aiModel === "mimo" || !aiModel;
  const tryGemini = aiModel === "gemini" || !aiModel;

  const fullPrompt = context
    ? `You are PeriodicVerse AI, an advanced chemistry tutor.\nContext about the current element or topic: ${context}\nUser message: ${prompt}\n\nAnswer the user concisely and accurately. Use simple terms when explaining complex concepts, but maintain scientific accuracy.`
    : prompt;

  if (tryMimo) {
    try {
      let content: any = fullPrompt;
      let model = "mimo-v2.5";
      if (imageBase64) {
        content = [
          { type: "text", text: fullPrompt },
          { type: "image_url", image_url: { url: imageBase64 } }, // imageBase64 assumes it contains the data uri prefix
        ];
        model = "mimo-v2-omni";
      }

      const response = await fetch(
        "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer tp-stsslosuvgflh0osdfbden4oe9eus1yeadj76nlfslg8f811",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content }],
            temperature: 0.2,
            max_tokens: 1500,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const msg = data.choices[0].message;
          return {
            text: msg.content,
            reasoning: msg.reasoning_content,
          };
        }
      }
      console.warn(
        "Mimo API returned non-ok status or empty response",
        response.status,
      );
    } catch (error) {
      console.warn("Mimo API request failed:", error);
      if (!tryGemini) throw error;
    }
  }

  if (tryGemini) {
    // Fallback to Gemini
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Mimo failed and GEMINI_API_KEY is not configured");
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const parts: any[] = [fullPrompt];
    if (imageBase64) {
      const mimeType = imageBase64.split(";")[0].split(":")[1];
      const data = imageBase64.split(",")[1];
      parts.push({
        inlineData: {
          data,
          mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
    });

    return { text: response.text || "", reasoning: undefined };
  }

  throw new Error("Failed to generate response with selected models.");
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
      const { message, context, image, aiModel } = req.body;
      const tryMimo = aiModel === "mimo" || !aiModel;
      const tryGemini = aiModel === "gemini" || !aiModel;

      const systemInstructions = `You are PeriodicVerse AI, an advanced chemistry tutor. You strictly act as PeriodicVerse AI. 
If you want to display a 3D model of an element to the user, output a markdown code block with the language "element" containing the atomic number or symbol of the element. For example:
\`\`\`element
1
\`\`\`
If you want to visualize a chemical bond, molecule, or reaction, output a markdown code block with "reaction" containing a comma-separated list of symbols. For example, for water (H2O):
\`\`\`reaction
H, H, O
\`\`\`
If the user asks you to control the website, show something, light up an element, change view, or click something, output a markdown code block with the language "action" containing a JSON array of commands. Valid action types are: "highlight" (requires "selector", e.g., "select" or "button"), "click" (requires "selector"), "navigate" (requires "target" as "table", "list", "playground", or "ai"), "select_category" (requires "value" from: "all", "nonmetal", "noble gas", "alkali metal", "alkaline earth metal", "metalloid", "transition metal", "post-transition metal", "lanthanide", "actinide"), "search" (requires "value", use empty string "" to clear), "select_element" (requires "value": "symbol or number", use null to close), "wait" (requires "duration" in ms), "playground" (requires "command": "set_temperature" | "set_pressure" | "set_catalyst" | "add_reactant" | "clear_reactants" | "simulate", "value": any, "quantity": number (optional for add_reactant)). For example:
\`\`\`action
[
  { "type": "navigate", "target": "playground" },
  { "type": "playground", "command": "clear_reactants" },
  { "type": "playground", "command": "add_reactant", "value": "H", "quantity": 2 },
  { "type": "wait", "duration": 2000 },
  { "type": "playground", "command": "add_reactant", "value": "O", "quantity": 1 },
  { "type": "playground", "command": "set_temperature", "value": 400 },
  { "type": "playground", "command": "simulate" }
]
\`\`\`
IMPORTANT: When showing multiple elements consecutively (a presentation), always clear the search query ({"type": "search", "value": ""}), clear the category ({"type": "select_category", "value": "all"}), and close the selected element ({"type": "select_element", "value": null}) at the end so the periodic table is restored to its default state.

Answer the user concisely and accurately.`;

      const fullPrompt = context 
        ? `${systemInstructions}\nContext about the current element or topic: ${context}\nUser message: ${message}`
        : `${systemInstructions}\nUser message: ${message}`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let generatedText = "";

      if (tryMimo) {
        try {
          let content: any = fullPrompt;
          let model = "mimo-v2.5";
          if (image) {
            content = [
              { type: "text", text: fullPrompt },
              { type: "image_url", image_url: { url: image } },
            ];
            model = "mimo-v2-omni";
          }

          const response = await fetch(
            "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization:
                  "Bearer tp-stsslosuvgflh0osdfbden4oe9eus1yeadj76nlfslg8f811",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content }],
                temperature: 0.2,
                max_tokens: 1500,
                stream: true,
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`Mimo API error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder("utf-8");
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.trim() === "data: [DONE]") break;
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    if (
                      data.choices &&
                      data.choices[0] &&
                      data.choices[0].delta
                    ) {
                      const deltaText = data.choices[0].delta.content || "";
                      const deltaReasoning =
                        data.choices[0].delta.reasoning_content || "";
                      if (deltaText || deltaReasoning) {
                        res.write(
                          `data: ${JSON.stringify({ text: deltaText, reasoning: deltaReasoning })}\n\n`,
                        );
                      }
                    }
                  } catch (e) {}
                }
              }
            }
          }
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        } catch (error) {
          console.warn("Mimo streaming failed, falling back to Gemini", error);
          if (!tryGemini) {
            res.write(
              `data: ${JSON.stringify({ error: "Failed to generate AI response." })}\n\n`,
            );
            res.end();
            return;
          }
        }
      }

      if (tryGemini) {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
          res.write(
            `data: ${JSON.stringify({ error: "GEMINI_API_KEY is not configured" })}\n\n`,
          );
          res.end();
          return;
        }

        const ai = new GoogleGenAI({ apiKey: key });

        const parts: any[] = [fullPrompt];
        if (image) {
          const mimeType = image.split(";")[0].split(":")[1];
          const data = image.split(",")[1];
          parts.push({
            inlineData: {
              data,
              mimeType,
            },
          });
        }

        const result = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: parts,
        });

        for await (const chunk of result) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
    } catch (error) {
      console.error("AI Error:", error);
      res.write(
        `data: ${JSON.stringify({ error: "Failed to generate AI response." })}\n\n`,
      );
      res.end();
    }
  });

  app.post("/api/explain10", async (req, res) => {
    try {
      const { element } = req.body;
      const prompt = `Explain the chemical element ${element} like I am 10 years old. Use fun analogies and keep it under 3 short paragraphs. Highlight its real-world usage.`;
      const result = await generateWithFallback(prompt);
      res.json(result);
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });

  app.post("/api/react", async (req, res) => {
    try {
      const { elements, temperature, pressure, catalyst } = req.body;

      const result = simulateReaction(
        elements,
        temperature,
        pressure,
        catalyst,
      );

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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
