import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_AI_API_KEY is not set. Please set it in your environment variables."
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getTextModel() {
  return getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
}

export function getImageModel() {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash-image",
  });
}
