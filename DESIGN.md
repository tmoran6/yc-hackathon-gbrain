# Design System — g-eyes

## Product Context
- **What this is:** g-eyes watches a non-technical business owner do their real
  work — once — segments it into reusable workflow skills, commits them to
  GStack, and grows a "company brain" that gradually runs routine operations
  with human approval.
- **Who it's for:** Owners and operators of SMBs that have never used AI —
  pharmacies, restaurants, retail shops, salons, auto-repair shops. Secondary:
  YC / technical evaluators who need to grasp the vision in 10 seconds.
- **Space/industry:** AI workflow automation / observe-and-automate / "company
  brain". Adjacent: Lindy, Gumloop, Adept, RPA, but the wedge is *AI adapts to
  the business, not the reverse*.
- **Project type:** Marketing landing page (standalone, `landing/`).

## Brand Idea
The name is the strategy: **g-eyes** = the product is the *eyes* of the
business. It watches how work is done, then the brain learns to do it.
The signature visual is the **aperture / iris** — observation becoming
intelligence. The narrative the whole page tells: **dull, dead legacy
software → seen → reborn as living automation.** The palette itself carries
this story (a deliberately drab "legacy" set vs. the luminous brand set).

- **One-line promise:** *Your business already knows how to run itself.*
- **Spine line:** *The business does not adopt AI first. AI adapts to the
  business first.*

## Aesthetic Direction
- **Direction:** Frontier Lab × Editorial. Cinematic dark "lab" canvas for the
  observation/transformation moments; warm editorial "paper" for the human
  explanation. One product, two worlds, told through one page.
- **Decoration level:** Expressive in the hero (procedural particle "eye" field,
  CRT scanlines on legacy, self-drawing node graph); intentional elsewhere
  (hairline rules, subtle grain, mono eyebrows); minimal in text-heavy copy so
  the words breathe.
- **Mood:** Calm authority with a jolt of wonder. It should feel like a frontier
  research lab that happens to care deeply about a pharmacist's Tuesday.
- **Reference posture:** literate in the category (clean type, dark hero,
  product-truth visuals) but memorable through the eye motif, the warm serif,
  and the legacy→living palette story.

## Typography
- **Display/Hero:** **Fraunces** (variable, optical sizing, soft mode, wght
  300–600). Deliberate risk: a warm, characterful serif humanizes a frontier-AI
  product for non-technical owners and refuses the generic-grotesk AI-SaaS look.
- **Body/UI:** **Geist** — clean, neutral, high legibility, tabular-nums
  available. The precise counterpoint to Fraunces' warmth.
- **Data/Tables:** **Geist** with `font-variant-numeric: tabular-nums`.
- **Code / generated-skill / legacy-terminal:** **Geist Mono** — used for the
  generated skill snippets and the old-software terminal texture.
- **Loading:** Google Fonts `<link>` — Fraunces (opsz,wght variable), Geist
  (300–700), Geist Mono (400–600). System fallbacks below.
- **Fallback stacks:**
  - Display: `"Fraunces", "Iowan Old Style", Georgia, serif`
  - Body: `"Geist", -apple-system, "Segoe UI", system-ui, sans-serif`
  - Mono: `"Geist Mono", "SF Mono", ui-monospace, monospace`
- **Scale (root 16px):**
  - Display XL (hero): `clamp(3rem, 8.5vw, 8rem)` / line-height 0.98 / wght 380
  - Display L: `clamp(2.25rem, 5vw, 4.25rem)` / 1.02
  - H2: `clamp(1.875rem, 3.6vw, 3rem)` / 1.06
  - H3: `1.5rem` / 1.2
  - Body L: `1.25rem` / 1.6
  - Body: `1.0625rem` (17px) / 1.65
  - Small: `0.9375rem` / 1.55
  - Eyebrow/label (mono): `0.75rem` / uppercase / letter-spacing 0.16em

## Color
- **Approach:** Restrained. Ink + paper + ONE signature accent. A separate
  "legacy" set exists only to depict old software — never as brand color.
- **Signature — Scan Lime:** `#CDF564` (primary energy/automation/alive).
  - glow tint `#E6FF8A` · deep/edge on light `#9FC53A` · wash `rgba(205,245,100,.14)`
- **Ink (dark base / default world):**
  - canvas `#0A0A0C` · surface `#111114` · raised `#17171B`
  - hairline `rgba(237,235,227,.10)`
  - text `#EDEBE3` · muted `#A4A29A` · faint `#6E6D67`
- **Paper (light editorial world):**
  - canvas `#F4F1E8` · surface `#FBFAF3` · raised `#FFFFFF`
  - hairline `rgba(21,20,15,.12)`
  - text `#15140F` · muted `#5E5C52` · faint `#8C8A7E`
- **Depth accent (sparing, hero/brain only):** Ink Teal `#0C2A27` — a near-black
  tint that lets the lime glow read. Replaces the AI-slop purple/blue entirely.
- **Legacy (storytelling only — depicting old software):**
  chrome `#C3C3C3` · face `#D9D5C7` · shadow `#7E7E7E` · title navy `#0A1F8F`
  · dead text `#2B2B2B` · sickly beige `#CFC9A8` · CRT green `#37C24A` ·
  scanline `rgba(0,0,0,.16)`
- **Semantic:** success `#7CE2A8` · warning `#F2B33C` · error `#FF6B5B`
  · info → neutral ink chip (no brand-blue; blue is reserved for "legacy")
- **Dark mode:** Dark IS the default (hero/lab). The light "paper" sections are
  intentional in-page, not a theme toggle. The preview/site ship dark-first;
  paper surfaces reduce lime saturation ~15% and use `#9FC53A` for accents.

## Spacing
- **Base unit:** 8px (4px half-step allowed).
- **Density:** Spacious for marketing narrative; comfortable inside cards.
- **Scale (px):** 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160
- **Section rhythm:** vertical padding `clamp(96px, 12vw, 200px)`.

## Layout
- **Approach:** Hybrid. Creative-editorial asymmetry for the cinematic
  hero/manifesto; grid-disciplined 12-col for "how it works" and use-case cards.
- **Grid:** 12-col, gutter 24px; mobile 4-col, gutter 16px.
- **Max content width:** 1200px; cinematic sections break full-bleed.
- **Border radius:** sm 6 · md 10 · lg 16 · xl 24 · pill 9999 ·
  **legacy = 0** (sharp 90s chrome, intentional contrast).

## Motion
- **Approach:** Expressive / cinematic. Signature = legacy ERP screen is
  *observed* (iris sweep), fractures into a particle field, reassembles into a
  self-drawing company-brain graph with a living iris core. Supporting:
  scroll-reveal stagger, mono text decode-in, generated-skill typewriter,
  absorbed-legacy marquee, magnetic CTAs, subtle grain/scanline.
- **Easing:** enter `cubic-bezier(.16,1,.3,1)` · exit `cubic-bezier(.7,0,.84,0)`
  · move `cubic-bezier(.65,0,.35,1)`
- **Duration:** micro 90ms · short 180ms · medium 320ms · long 600ms ·
  cinematic 1200ms
- **Accessibility:** `prefers-reduced-motion` → no fracture/particles; render
  the final graph state statically with a legacy ghost; reveals become instant
  opacity. Never trap scroll.

## Anti-Slop Rules (enforced)
- No purple/violet gradient accents. (Blue exists ONLY as "dead legacy".)
- No 3-col icon-in-colored-circle feature grid.
- No centered-everything uniform layout — use editorial asymmetry.
- No gradient primary buttons; CTA is solid Scan Lime on ink, ink text.
- No stock-photo hero; the hero is a procedural product-truth scene.
- No "Built for X / Designed for Y" filler copy — copy is concrete and earned.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-16 | Initial design system created | /design-consultation. Brand confirmed `g-eyes`; eye/aperture motif chosen because the name = the product (it watches). Fraunces+Geist+Geist Mono. Scan Lime signature with a deliberate "legacy" palette so the page's colors tell the old→new story. Standalone build in `landing/`. |
