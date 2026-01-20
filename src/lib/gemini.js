import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ✅ FIX: Use the specific version "gemini-1.5-flash-001"
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest", 
  generationConfig: { responseMimeType: "application/json" }
});