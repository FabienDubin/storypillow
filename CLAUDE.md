# Storypillow 🌙

> Générateur d’histoires illustrées pour enfants, propulsé par Google Gemini AI.

## Project Context

This is a Next.js web application that generates illustrated bedtime stories for children. A parent configures a story theme, the AI generates a narrative plan, then the full text, then character reference images, and finally illustrations — resulting in a beautiful “picture book” layout readable on an iPad.

**Read the full PRD in `/docs/PRD.md` before starting any work.**

## Tech Stack

- **Framework:** Next.js 16.1 (App Router, Server Components, Route Handlers, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** SQLite via better-sqlite3 (with Drizzle ORM)
- **AI:** Google Gemini API (@google/generative-ai SDK)
  - Text generation: gemini-2.5-flash
  - Image generation: gemini-2.5-flash-image (Nano Banana) — supports character consistency via reference images
- **Containerization:** Docker + Docker Compose
- **Runtime:** Node.js 22 LTS

## Project Structure

```
storypillow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard (story library)
│   │   ├── create/
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Story creation wizard
│   │   │       ├── plan/page.tsx   # Step 2: Plan review
│   │   │       ├── text/page.tsx   # Step 3: Text review
│   │   │       ├── characters/page.tsx # Step 4: Character creation
│   │   │       └── images/page.tsx # Step 5: Illustration generation
│   │   ├── read/
│   │   │   └── [id]/page.tsx   # Full-screen reading mode
│   │   ├── api/                # API Route Handlers
│   │   │   ├── stories/
│   │   │   └── characters/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── story/              # Story-specific components
│   │   └── reader/             # Reading mode components
│   ├── lib/
│   │   ├── db/                 # Database schema & queries (Drizzle + SQLite)
│   │   ├── ai/                 # Gemini API integration
│   │   │   ├── client.ts       # Gemini client setup
│   │   │   ├── prompts.ts      # All AI prompts
│   │   │   ├── generate-plan.ts
│   │   │   ├── generate-text.ts
│   │   │   ├── generate-character.ts
│   │   │   └── generate-illustration.ts
│   │   └── utils/              # Helpers
│   └── types/                  # TypeScript types
├── public/
├── data/                       # SQLite database (Docker volume)
├── uploads/                    # Uploaded reference images (Docker volume)
├── generated/                  # AI-generated images (Docker volume)
├── docs/
│   └── PRD.md                  # Full product requirements
├── Dockerfile
├── docker-compose.yml
├── drizzle.config.ts
└── .env.example                # GOOGLE_AI_API_KEY=your_key_here
```

## Key Implementation Notes

### AI Integration

- Use `@google/generative-ai` npm package
- The API key is provided via `GOOGLE_AI_API_KEY` environment variable
- For image generation with character consistency: send reference images as inline_data parts in the Gemini request
- Image generation model `gemini-2.5-flash-image` supports up to 14 reference images per request
- All generated images should be saved to `/generated/{storyId}/` directory
- All uploaded images should be saved to `/uploads/{storyId}/` directory

### Database

- Use Drizzle ORM with better-sqlite3 driver
- Database file at `/data/storypillow.db`
- Run migrations on app startup
- Store JSON data (like the plan) as TEXT columns with JSON.parse/stringify

### Story Generation Flow

1. Parent fills onboarding form → creates story record (status: draft)
1. Generate plan → AI returns structured plan → save (status: plan_ready)
1. Parent validates plan → generate full text → save pages (status: text_ready)
1. Extract characters from text → parent creates/generates reference images (status: characters_ready)
1. Generate illustration prompts → parent validates → batch generate images (status: images_ready)
1. All done → status: complete → reading mode available

### Image Generation Prompts

- Always prefix with: “children’s book illustration, digital painting, cartoon style, warm lighting, soft colors, cozy atmosphere, “
- Always include character reference images for characters present in the scene
- Use 4:3 landscape aspect ratio
- Include scene description from the story text

### Reading Mode

- Full-screen, distraction-free
- Large readable typography (min 20px body text)
- Swipe navigation between pages
- Dark mode with warm tones for evening reading
- Each page: illustration on top half, text on bottom half

### Design Direction

- Warm, cozy, nighttime aesthetic (like a nightlight)
- Color palette: deep navy blue, soft purple, golden yellow (moon/stars), warm cream for text
- Decorative elements: subtle stars, crescent moon, soft clouds
- Playful but readable fonts

## Commands

```bash^x ^x# Development npm run dev # Start 
dev server npm run build # Build for 
production npm run db:push # Push schema 
changes to SQLite npm run db:studio # Open 
Drizzle Studio ^x ^x# Docker docker compose 
up --build # Build and run docker compose 
down # Stop ``` 

## Environment Variables

```
GOOGLE_AI_API_KEY=            # Required: Google AI Studio API key
DATABASE_URL=file:./data/storypillow.db
```

## Important Constraints

- NO authentication in V1 (local use only behind VPN)
- Stories and UI text in FRENCH
- Single image style (cartoon digital painting)
- SQLite only (no external DB)
- All images stored on local filesystem
- Must work in Docker on Unraid
- Port: 3333 (mapped to internal 3000)
