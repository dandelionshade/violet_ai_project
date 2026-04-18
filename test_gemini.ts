import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ override: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: "hello",
    });
    console.log("gemini-3.1-flash-preview success", response.text);
  } catch (e) {
    console.error("gemini-3.1-flash-preview error", e);
  }
}
run();
