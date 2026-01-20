import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  // We log a warning instead of crashing to allow fallback logic to work
  console.warn("⚠️ Missing GROQ_API_KEY. Smart search will default to text search.");
}

export const groqClient = new Groq({
  apiKey: apiKey || "dummy_key", // Prevent crash if key is missing during build
});