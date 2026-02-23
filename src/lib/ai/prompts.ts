import type { PlanItem } from "@/types";

export function buildPlanPrompt(params: {
  theme: string;
  setting: string;
  tone: string;
  moral: string;
  duration: number;
  childName: string;
  context: string;
}): string {
  const sceneCount =
    params.duration === 5 ? "4-5" : params.duration === 10 ? "6-8" : "8-10";

  return `Tu es un auteur de livres pour enfants de 5 à 8 ans. Tu dois créer un plan narratif structuré pour une histoire du soir.

Paramètres de l'histoire :
- Thématique : ${params.theme}
- Lieu : ${params.setting}
- Ton : ${params.tone}
- Valeur/Morale : ${params.moral}
- Durée de lecture visée : ${params.duration} minutes
- Prénom du protagoniste : ${params.childName}
${params.context ? `- Contexte additionnel : ${params.context}` : ""}

Structure narrative à respecter :
1. Introduction — Présentation du protagoniste, du cadre, de la situation initiale
2. Élément déclencheur — Un événement qui lance l'aventure
3. Développement / Péripéties — 2 à 4 scènes avec montée progressive de la tension (adaptée à l'âge)
4. Climax — Le moment fort où le protagoniste fait face au défi principal
5. Résolution — Dénouement positif, la morale émerge naturellement
6. Conclusion — Retour au calme, parfait pour la transition vers le sommeil

Le plan doit contenir ${sceneCount} scènes au total.
Chaque scène doit être illustrable (pense à des descriptions visuelles).

Réponds UNIQUEMENT avec un JSON valide, sans texte autour, au format suivant :
{
  "title": "Titre de l'histoire",
  "plan": [
    { "title": "Titre de la scène", "description": "2-3 phrases décrivant la scène, l'action, et les éléments visuels." }
  ]
}`;
}

export function buildTextPrompt(params: {
  title: string;
  plan: PlanItem[];
  theme: string;
  setting: string;
  tone: string;
  moral: string;
  duration: number;
  childName: string;
  context: string;
}): string {
  const wordsTarget = params.duration * 150;

  const planText = params.plan
    .map((item, i) => `${i + 1}. ${item.title}: ${item.description}`)
    .join("\n");

  return `Tu es un auteur de livres pour enfants de 5 à 8 ans. Tu dois écrire le texte complet d'une histoire du soir basée sur le plan narratif ci-dessous.

Titre : ${params.title}
Thématique : ${params.theme}
Lieu : ${params.setting}
Ton : ${params.tone}
Valeur/Morale : ${params.moral}
Protagoniste : ${params.childName}
${params.context ? `Contexte : ${params.context}` : ""}

Plan narratif :
${planText}

Consignes d'écriture :
- Vocabulaire adapté à un enfant de 6 ans
- Phrases courtes et rythmées (lecture à voix haute)
- Dialogues fréquents pour rendre vivant
- Onomatopées et répétitions (techniques narratives orales)
- Fin douce et apaisante (contexte coucher)
- Environ ${wordsTarget} mots au total
- Le texte doit être découpé en sections correspondant au plan

Réponds UNIQUEMENT avec un JSON valide, sans texte autour, au format suivant :
{
  "pages": [
    { "title": "Titre de la scène", "text": "Le texte complet de cette page/scène." }
  ]
}`;
}

export function buildCharacterExtractionPrompt(pages: { title: string; text: string }[]): string {
  const fullText = pages.map((p) => `[${p.title}]\n${p.text}`).join("\n\n");

  return `Tu es un assistant qui analyse des histoires pour enfants. Extrais la liste de TOUS les personnages de l'histoire suivante.

Histoire :
${fullText}

Pour chaque personnage, donne :
- Son nom
- Une description physique détaillée (apparence, vêtements, particularités) telle que décrite ou suggérée dans le texte

Réponds UNIQUEMENT avec un JSON valide, sans texte autour :
{
  "characters": [
    { "name": "Nom du personnage", "description": "Description physique détaillée pour pouvoir l'illustrer de manière cohérente." }
  ]
}`;
}

export function buildCharacterImagePrompt(character: {
  name: string;
  description: string;
}): string {
  return `children's book digital painting, cartoon style, warm and soft colors, friendly expression, white background, character sheet, full body view of ${character.name}: ${character.description}`;
}

export function buildImagePromptSuggestions(pages: { title: string; text: string }[], characters: { name: string; description: string }[]): string {
  const pagesText = pages
    .map((p, i) => `Page ${i + 1} - ${p.title}: ${p.text}`)
    .join("\n\n");

  const charText = characters
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");

  return `Tu es un directeur artistique pour des livres illustrés pour enfants. Pour chaque page de l'histoire, propose un prompt de génération d'image.

Personnages :
${charText}

Pages de l'histoire :
${pagesText}

Style fixe : "children's book illustration, digital painting, cartoon style, warm lighting, soft colors, cozy atmosphere"
Format : paysage 4:3

Pour chaque page, crée un prompt en anglais qui décrit précisément la scène à illustrer. Inclus les personnages présents et leurs actions.

Réponds UNIQUEMENT avec un JSON valide :
{
  "prompts": [
    "prompt complet pour la page 1",
    "prompt complet pour la page 2"
  ]
}`;
}
