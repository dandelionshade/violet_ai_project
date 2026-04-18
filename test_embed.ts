import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ override: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: "hello world",
    });
    console.log("text-embedding-004 success", response.embeddings?.[0]?.values?.length);
  } catch (e) {
    console.error("text-embedding-004 error", e);
  }
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: "hello world",
    });
    console.log("gemini-embedding-2-preview success", response.embeddings?.[0]?.values?.length);
  } catch (e) {
    console.error("gemini-embedding-2-preview error", e);
  }
}
run();
