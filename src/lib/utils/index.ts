import { v4 as uuidv4 } from "uuid";

export function generateId(): string {
  return uuidv4();
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 150;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
