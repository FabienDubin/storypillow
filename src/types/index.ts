export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export type StoryStatus =
  | "draft"
  | "plan_ready"
  | "text_ready"
  | "characters_ready"
  | "images_ready"
  | "complete";

export interface Story {
  id: string;
  title: string;
  theme: string;
  setting: string;
  tone: string;
  moral: string;
  duration: number;
  childName: string;
  context: string;
  plan: PlanItem[] | null;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoryPage {
  id: string;
  storyId: string;
  pageNumber: number;
  title: string;
  text: string;
  imagePrompt: string | null;
  imagePath: string | null;
  createdAt: string;
}

export interface Character {
  id: string;
  storyId: string;
  name: string;
  description: string;
  referenceImagePath: string | null;
  isUploaded: boolean;
  createdAt: string;
}

export interface PlanItem {
  title: string;
  description: string;
}

export interface StoryFormData {
  theme: string;
  setting: string;
  tone: string;
  moral: string;
  duration: number;
  childName: string;
  context: string;
}

// Dropdown options for the onboarding form
export const THEME_OPTIONS = [
  "Aventure",
  "Fantaisie/Magie",
  "Animaux",
  "Espace",
  "Océan/Pirates",
  "Nature/Forêt",
  "Amitié",
  "Super-héros",
  "Contes classiques revisités",
  "Voyage dans le temps",
] as const;

export const SETTING_OPTIONS = [
  "Forêt enchantée",
  "Château",
  "Sous la mer",
  "Espace",
  "Village",
  "Montagne",
  "Île mystérieuse",
  "Ville futuriste",
  "Jungle",
  "Monde miniature",
] as const;

export const TONE_OPTIONS = [
  "Drôle",
  "Poétique",
  "Mystérieux",
  "Héroïque",
  "Tendre",
] as const;

export const MORAL_OPTIONS = [
  "Courage",
  "Amitié",
  "Partage",
  "Confiance en soi",
  "Curiosité",
  "Respect de la nature",
  "Entraide",
  "Persévérance",
  "Acceptation des différences",
  "Imagination",
] as const;

export const DURATION_OPTIONS = [5, 10, 15] as const;
