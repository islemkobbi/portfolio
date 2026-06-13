# Portfolio Website Plan — Islem KOBBI
## Research-Grade Personal Portfolio · GitHub Pages · $10k-Level Execution

---

## 1. VISION & PHILOSOPHY

**The brief in one sentence:** A dark, technically immersive portfolio that positions Islem as a serious AI/robotics researcher while remaining approachable enough to land industry opportunities.

**The site's single job:** Convert a visitor (recruiter, conference peer, professor, hiring manager) into someone who reaches out within 60 seconds of landing.

**Design personality:** Precise, intelligent, kinetic. Not a startup landing page — closer to a research lab's flagship project page with personality injected. Think CERN's aesthetic restraint crossed with a GPU company's sense of raw power.

**The signature element (what makes it memorable):**  
An interactive neural network canvas background where nodes are loosely organized into visible **layer columns** (input → hidden → hidden → output), slowly drifting. Hovering sends a forward-pass "activation pulse" that ripples through the network in the direction of inference — left to right. This is not decoration: it *is* the thesis of the page, a man who teaches machines to think.

---

## 2. DESIGN SYSTEM

### Color Palette
```
--bg-void:       #04040f   (near-black with blue cast — the canvas)
--bg-surface:    #080818   (card backgrounds)
--bg-glass:      rgba(8, 8, 28, 0.7) + backdrop-blur(12px)
--border-dim:    rgba(100, 120, 255, 0.12)
--border-active: rgba(80, 200, 255, 0.4)

--node-rest:     rgba(60, 120, 220, 0.35)  (dormant NN nodes)
--node-active:   rgba(80, 220, 255, 1.0)   (activated nodes — cyan electric)
--edge-rest:     rgba(60, 100, 200, 0.08)
--edge-active:   rgba(80, 220, 255, 0.6)

--accent-primary:  #00d4ff  (electric cyan — for links, highlights)
--accent-secondary:#7b5ea7  (muted violet — for tags, secondary labels)
--accent-warm:     #ff6b35  (burnt orange — used ONCE, for the "Download CV" CTA)

--text-primary:  #e8eaf6
--text-secondary:#8892b0
--text-dim:      #4a5568
```

### Typography
- **Display** — `Space Grotesk` (variable weight). Used for name, section titles. Wide letterspacing on the name. Mathematical, technical without feeling cold.
- **Body** — `Inter`. Dense information in cards, timelines, abstracts.
- **Mono** — `JetBrains Mono`. Used for skill tags, paper citations, data labels. Signals that this person writes real code.

```css
Type scale:
--t-xs:   0.72rem  (labels, mono tags)
--t-sm:   0.875rem (secondary body)
--t-base: 1rem     (body)
--t-lg:   1.2rem   (card titles)
--t-xl:   1.5rem   (section headers)
--t-2xl:  2.5rem   (hero subtitle)
--t-3xl:  4.5rem   (hero name — Space Grotesk 700)
```

### Motion Contract
- All transitions: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy ease-out)
- Card hover lift: `translateY(-4px)` + border brightens
- Scroll reveals: `opacity 0→1` + `translateY(20px→0)`, staggered per card
- NN pulses: 800ms, `cubic-bezier(0.4, 0, 0.2, 1)`
- `@media (prefers-reduced-motion)`: canvas stops, transitions set to 0ms

---

## 3. FILE & FOLDER STRUCTURE

```
kobbi-portfolio/                    ← git repo root
│
├── index.html                      ← single page
├── 404.html                        ← graceful GitHub Pages 404
│
├── css/
│   ├── reset.css                   ← minimal modern reset
│   ├── tokens.css                  ← all CSS custom properties
│   ├── layout.css                  ← grid systems, section wrappers
│   ├── components.css              ← cards, buttons, tags, timeline
│   ├── neural-bg.css               ← canvas positioning, overlay gradient
│   └── animations.css              ← keyframes, scroll reveal classes
│
├── js/
│   ├── neural-bg.js                ← canvas engine (self-contained)
│   ├── content-loader.js           ← reads JSON → builds DOM
│   ├── scroll-reveal.js            ← IntersectionObserver animations
│   ├── nav.js                      ← sticky nav, active section highlight
│   └── main.js                     ← bootstraps everything
│
├── data/                           ← ALL editable content lives here
│   ├── profile.json
│   ├── publications.json
│   ├── experience.json
│   ├── education.json
│   ├── projects.json
│   └── skills.json
│
├── assets/
│   ├── img/
│   │   ├── profile.jpg             ← your photo
│   │   └── papers/                 ← paper preview images (optional)
│   └── docs/
│       └── CV_KOBBI.pdf            ← downloadable CV
│
├── admin/                          ← LOCAL ONLY — never deployed
│   ├── index.html                  ← admin dashboard
│   ├── admin.css
│   └── admin.js
│
├── .github/
│   └── workflows/
│       └── deploy.yml              ← auto-deploy to gh-pages on push to main
│
└── .gitignore                      ← includes /admin/ if you want it private
```

**Key principle:** All content is JSON. The HTML is a skeleton. JavaScript reads the JSON and stamps out DOM. This means updating a publication = editing one JSON file, no touching HTML.

---

## 4. SECTION-BY-SECTION BREAKDOWN

### 4.1 NAV BAR
- Fixed top, `backdrop-filter: blur(20px)`, transparent until scrolled 50px then gains `--bg-glass` background
- Left: Monogram `IK` in `Space Grotesk` bold + a small animated node pulse every ~4s
- Right: `Research · Experience · Skills · Projects · Contact` — all smooth-scroll anchors
- Mobile: hamburger → full-screen overlay nav with the same NN effect in miniature
- Active section tracked via `IntersectionObserver` → nav link gets underline accent

### 4.2 HERO (full viewport)
```
┌─────────────────────────────────────────────────────────────┐
│  [NN CANVAS — full viewport, layers faintly visible]       │
│                                                             │
│  (centered, vertically middle-ish, slight left offset)      │
│                                                             │
│  ISLEM KOBBI                    ← Space Grotesk 700, 4.5rem │
│  ─────────────────                                          │
│  PhD Researcher · INRIA Paris                               │
│  Reinforcement Learning for Autonomous Driving              │
│                                                             │
│  [ View Research ↓ ]   [ Download CV ]                     │
│                         (burnt orange CTA)                  │
│                                                             │
│  ──── Scroll ↓ ────                                         │
└─────────────────────────────────────────────────────────────┘
```

- The name types itself on load (typewriter, but fast, 40ms/char — feels intentional not gimmicky)
- Subtitle fades in after name completes
- Buttons slide up after subtitle
- Bottom edge: a very faint gradient fade to `--bg-void` so next section blends in
- No hero image of person here — the NN *is* the visual

### 4.3 ABOUT
```
┌───────────────┬──────────────────────────────────────────────┐
│               │  Islem KOBBI                                  │
│  [Photo]      │  PhD student at INRIA (ASTRA Team), Paris.   │
│  circular     │  I build motion planners that teach          │
│  with glow    │  autonomous vehicles to navigate the world   │
│  border       │  safely — using reinforcement learning        │
│               │  and closed-map self-play.                    │
│               │                                              │
│               │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│               │  │  2   │ │  3+  │ │  3   │ │  2   │       │
│               │  │ pubs │ │ yrs  │ │ lang │ │ deg  │       │
│               │  └──────┘ └──────┘ └──────┘ └──────┘       │
└───────────────┴──────────────────────────────────────────────┘
```
- Stat counters animate up on scroll-in (0 → final value, 600ms)
- Photo has a `--accent-primary` glowing ring (CSS `box-shadow`)
- `profile.json` controls: photo path, bio text, stat values

### 4.4 RESEARCH / PUBLICATIONS
- Section title: `Research`
- Subtitle: `Publications & Preprints`
- Cards — one per paper, horizontal on desktop, stacked on mobile:

```
┌──────────────────────────────────────────────────────────────┐
│  [venue badge: INRIA · 2025]                                 │
│  SelfPlan: Learning Mid-to-Mid Motion Planning               │
│  through Closed-Map Self-Play                                │
│                                                              │
│  Islem Kobbi, Tiago Rocha Gonçalves, Fawzi Nashashibi        │
│                                                              │
│  Abstract excerpt... (2 lines, expandable)                   │
│                                                              │
│  [RL] [Autonomous Driving] [Motion Planning] [Self-Play]     │
│                                                              │
│  [ PDF ↗ ]   [ HAL ↗ ]   [ Cite ]                           │
│                     97% success on CARLA ←key result badge  │
└──────────────────────────────────────────────────────────────┘
```

- Key result badge: pulls `keyResult` field from JSON → shown as a glowing pill
- "Cite" copies BibTeX to clipboard with a toast notification
- `publications.json` schema:

```json
{
  "papers": [
    {
      "id": "selfplan-2025",
      "title": "SelfPlan: Learning Mid-to-Mid Motion Planning through Closed-Map Self-Play",
      "authors": ["Islem Kobbi", "Tiago Rocha Gonçalves", "Fawzi Nashashibi"],
      "venue": "INRIA · 2025",
      "tags": ["Reinforcement Learning", "Autonomous Driving", "Motion Planning", "Self-Play"],
      "abstract": "This paper introduces SelfPlan, a closed-map scalable self-play framework...",
      "links": {
        "pdf": "assets/docs/selfplan.pdf",
        "hal": "https://hal.science/hal-05294346",
        "arxiv": ""
      },
      "keyResult": "0.97 success · 0.02 collision rate on CARLA",
      "bibtex": "@article{kobbi2025selfplan, ...}"
    }
  ]
}
```

### 4.5 EXPERIENCE (Timeline)
- Left-anchored vertical timeline line (1px, `--accent-primary` with low opacity)
- Timeline dots: small circles that pulse once on scroll-in
- Each entry: date range (mono font, dim), company/role, description, tags

```
   Oct 2023 ──●── Doctorant — INRIA, Paris
              │   Reinforcement learning for decision-making
              │   and motion planning in autonomous driving.
              │   [RL] [Autonomous Driving] [ROS]
              │
   Feb 2024 ──●── R&D Deep Learning Intern — Astek, Paris
              │   Multimodal systems for traffic sign
              │   reconstruction, detection, and recognition.
              │   [Deep Learning] [Computer Vision] [PyTorch]
```

- `experience.json` controls all entries
- Each tag is styled with `--accent-secondary` background

### 4.6 SKILLS
Two-column layout:

**Left — Technical Skills** (with visual bar)
```
Python        ████████████████░░  90%
PyTorch       ██████████████░░░░  78%
C/C++         ████████████░░░░░░  65%
ROS / Docker  ██████████████░░░░  75%
...
```
Bars animate width from 0 on scroll-in (600ms staggered).

**Right — Tool Ecosystem** (tag cloud arranged by category)
```
AI/ML           Deep Learning
[PyTorch] [Keras] [TensorFlow] [scikit-learn]
[XGBoost] [OpenCV] [NumPy] [Pandas]

Simulation
[ROS] [Gazebo] [CARLA] [Docker]

Languages
[Python] [C++] [Java] [JavaScript]
```

Tags are monospace, rounded, with category color coding.

### 4.7 PROJECTS
3-column card grid (2 on tablet, 1 on mobile):

```
┌──────────────────────┐
│  ◈ Vision Sentiment  │
│  Detection           │
│                      │
│  Improved emotion    │
│  detection by        │
│  guiding CNN         │
│  attention to facial │
│  regions.            │
│                      │
│  [CNN] [Vision] [DL] │
│                      │
│  [ Details → ]       │
└──────────────────────┘
```
Card hover: lifts 4px, border brightens, subtle glow.
`Details →` expands inline (accordion, no page change) with full description.

### 4.8 EDUCATION
Clean two-entry timeline, same style as experience but distinct icon (graduation cap SVG inline).

### 4.9 CONTACT
```
┌──────────────────────────────────────────────────────────────┐
│              Let's talk research.                            │
│                                                              │
│   islem.kobbi@inria.fr         islem.kobbi@outlook.com      │
│                                                              │
│   [ GitHub ]  [ LinkedIn ]  [ Google Scholar ]              │
│                                                              │
│   Paris, France · (+33) 07 58 94 16 98                      │
└──────────────────────────────────────────────────────────────┘
```
No contact form (avoids spam, no server needed). Just styled links with icon + copy-to-clipboard on email click.

---

## 5. NEURAL NETWORK BACKGROUND — TECHNICAL SPEC

**File:** `js/neural-bg.js` — fully self-contained class `NeuralBg`.

### Architecture
```
Canvas fills 100vw × 100vh, position:fixed, z-index:-1
Nodes: ~120 total, organized into 5 loose columns (layers)
  Layer 0 (input):   ~15 nodes, x: 5-15% of width
  Layer 1 (hidden1): ~30 nodes, x: 25-35%
  Layer 2 (hidden2): ~35 nodes, x: 45-55%  ← densest, center screen
  Layer 3 (hidden3): ~25 nodes, x: 65-75%
  Layer 4 (output):  ~15 nodes, x: 85-95%

Each node has:
  - base x, y (Gaussian distributed within its layer column)
  - drift: slow sine wave offset (amplitude ±12px, period 6-14s, unique per node)
  - radius: 2-4px
  - activation: 0.0–1.0 (drives brightness and glow)
  - activation decays toward 0 at rate 0.02/frame
```

### Connection Rules
```
Two nodes are connected if:
  1. They are in adjacent layers (layer i to layer i+1), OR
  2. They are within 80px in the same layer (skip connections)
  
Max connections per node: 4
Edge opacity = min(nodeA.activation, nodeB.activation) × 0.6
               + baseOpacity (0.04)
```

### Mouse Interaction
```
On mousemove:
  - Find all nodes within 150px of cursor
  - Set their activation = min(1.0, activation + 0.4)
  - Each activated node triggers its right-side neighbors with a
    50ms delay × layer distance (forward pass simulation)

On click:
  - Pick the nearest node, set activation = 1.0
  - Trigger a full left-to-right wave: each layer activates
    with a 120ms delay after the previous
```

### Render Loop (requestAnimationFrame)
```javascript
// Per frame:
1. Clear canvas (fillRect with rgba(4,4,15, 0.15)) ← trail effect, not full clear
2. Update all node positions (apply drift)
3. Decay all activations by 0.015
4. Draw edges:
   - Color: lerp(--edge-rest, --edge-active, activation)
   - Width: 0.5px base, up to 1.5px when active
5. Draw nodes:
   - Fill: lerp(--node-rest, --node-active, activation)
   - Glow: if activation > 0.3, apply ctx.shadowBlur = activation × 15
6. Handle auto-pulse: every 4 seconds, pick a random input-layer node
   and fire a quiet activation wave (max activation 0.5) — keeps it alive
   when user is not interacting
```

### Performance
- On mobile (`window.innerWidth < 768`): reduce to 60 nodes, disable glow (`shadowBlur`)
- Use `devicePixelRatio` for sharp rendering on retina screens
- Canvas is separate from scroll — fixed position, no reflow cost
- The canvas opacity is reduced to 0.4 within non-hero sections (CSS overlay gradient handles this) so it doesn't fight with text readability

---

## 6. CONTENT LOADER SYSTEM

`js/content-loader.js` fetches all JSON files in parallel on page load:

```javascript
async function loadAll() {
  const [profile, publications, experience, education, projects, skills] =
    await Promise.all([
      fetch('data/profile.json').then(r => r.json()),
      fetch('data/publications.json').then(r => r.json()),
      fetch('data/experience.json').then(r => r.json()),
      fetch('data/education.json').then(r => r.json()),
      fetch('data/projects.json').then(r => r.json()),
      fetch('data/skills.json').then(r => r.json()),
    ]);

  renderProfile(profile);
  renderPublications(publications);
  renderExperience(experience);
  renderEducation(education);
  renderProjects(projects);
  renderSkills(skills);
}
```

Each `render*` function builds DOM nodes and inserts them into pre-defined skeleton containers in `index.html`. No heavy templating library needed — plain `createElement` / `innerHTML` on isolated containers.

**Skeleton in index.html (example):**
```html
<section id="research" class="section">
  <div class="section-header">
    <span class="section-eyebrow">Research</span>
    <h2 class="section-title">Publications</h2>
  </div>
  <div id="publications-container"></div>  <!-- JS fills this -->
</section>
```

---

## 7. LOCAL ADMIN TOOL

**Location:** `admin/index.html` — run locally, never committed to `gh-pages` branch, or add to `.gitignore`.

**Technology:** Uses the browser's [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) (Chrome/Edge). No server, no Node.js, no install.

### Admin UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  KOBBI Portfolio Admin                    [Open data folder]│
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  ◉ Profile   │  [Form fields for selected section]         │
│  ○ Papers    │                                              │
│  ○ Experience│  Add Publication:                           │
│  ○ Education │  Title: [________________________]          │
│  ○ Projects  │  Authors: [_______________________]         │
│  ○ Skills    │  Venue: [_________________________]         │
│              │  Year: [______]                             │
│  [+ New]     │  Abstract: [                    ]           │
│              │  Tags: [+ Add tag]                          │
│              │  PDF link: [______________________]         │
│              │  HAL link: [______________________]         │
│              │  Key result: [___________________]          │
│              │  BibTeX: [                      ]           │
│              │                                             │
│              │  [Delete]              [Save Changes]       │
└──────────────┴──────────────────────────────────────────────┘
```

### How it works
```javascript
// 1. User clicks "Open data folder" → File System Access API picker
const dirHandle = await window.showDirectoryPicker();

// 2. Admin reads the relevant JSON
const fileHandle = await dirHandle.getFileHandle('publications.json');
const file = await fileHandle.getFile();
const data = JSON.parse(await file.text());

// 3. Renders form fields from the data

// 4. On "Save Changes":
const writable = await fileHandle.createWritable();
await writable.write(JSON.stringify(updatedData, null, 2));
await writable.close();
// File is now saved to disk in your local repo
```

### Admin Features
- **Profile editor**: Photo path, bio, stat values
- **Publications manager**: Add / edit / delete papers. All fields from the schema above.
- **Experience manager**: Add/edit entries with drag-to-reorder
- **Projects manager**: Same
- **Skills editor**: Adjust percentages and tags
- **Preview button**: Opens `../index.html` in a new tab (requires running a local server)
- **Deploy shortcut**: Shows the `git` commands to run (cannot execute them, but copies to clipboard)

**To run the admin:**
```bash
# From the repo root, start a simple local server
python -m http.server 8080
# Then open: http://localhost:8080/admin/
```

---

## 8. GITHUB PAGES DEPLOYMENT

### Strategy: Two-branch approach

```
main branch        → your source code (all files including admin/)
gh-pages branch    → only the deployed files (no admin/)
```

### GitHub Actions workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy Portfolio

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          exclude_assets: 'admin/**,.github/**,*.md'
```

This auto-deploys on every push to `main` and excludes the admin folder.

**Domain:** `islemkobbi.github.io` (or custom domain if you have one — just add a `CNAME` file).

### Manual deploy option (no GitHub Actions)
```bash
# One-time setup
git checkout -b gh-pages
git push origin gh-pages
git checkout main

# Each deploy:
git add data/ assets/ index.html css/ js/
git commit -m "Update content"
git push origin main
# GitHub Actions handles the rest automatically
```

---

## 9. PERFORMANCE & SEO

### Performance targets
- **Lighthouse score**: 95+ Performance, 100 Accessibility, 100 SEO
- **LCP** (Largest Contentful Paint): < 1.5s — profile photo is lazy-loaded, CSS inlined for above-fold
- **No external runtime dependencies** — no React, no jQuery, no bloat

### SEO
```html
<!-- In index.html <head> -->
<title>Islem KOBBI — AI Researcher · Autonomous Driving · INRIA Paris</title>
<meta name="description" content="PhD researcher at INRIA Paris working on 
  reinforcement learning and motion planning for autonomous vehicles.">
<meta property="og:title" content="Islem KOBBI — AI Researcher">
<meta property="og:image" content="assets/img/og-preview.jpg">
<meta property="og:url" content="https://islemkobbi.github.io">
<link rel="canonical" href="https://islemkobbi.github.io">
```

### Accessibility
- All canvas animation: `aria-hidden="true"`, `role="presentation"`
- Full keyboard navigation, visible focus rings
- `alt` text on all images
- Color contrast ratio ≥ 4.5:1 for all text
- `prefers-reduced-motion`: canvas stops drifting (nodes stay static), transitions removed

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1 — Foundation (Day 1–2)
- [ ] Create repo, configure GitHub Pages
- [ ] Set up folder structure
- [ ] Write `tokens.css`, `reset.css`, `layout.css`
- [ ] Build `index.html` skeleton with all section anchors
- [ ] Implement `neural-bg.js` — get the canvas working first
- [ ] Verify canvas performance on mobile

### Phase 2 — Content System (Day 3)
- [ ] Write all 6 JSON files with real content from CV/paper
- [ ] Implement `content-loader.js` — fetch + render all sections
- [ ] Build all `render*` functions (publications, experience, etc.)
- [ ] Add profile photo and CV PDF to assets

### Phase 3 — Components & Polish (Day 4–5)
- [ ] Style all cards, timeline, skill bars (`components.css`)
- [ ] Implement `scroll-reveal.js` with `IntersectionObserver`
- [ ] Sticky nav + active section tracking (`nav.js`)
- [ ] Hero typewriter effect
- [ ] Stat counter animations
- [ ] BibTeX clipboard copy + toast

### Phase 4 — Admin Tool (Day 6)
- [ ] Build `admin/index.html` with all section editors
- [ ] Implement File System Access API read/write
- [ ] Test editing each section and verifying the live site updates

### Phase 5 — QA & Launch (Day 7)
- [ ] Lighthouse audit → fix issues
- [ ] Test on mobile (iOS Safari, Android Chrome) — especially canvas performance
- [ ] Check all links work
- [ ] Set up GitHub Actions auto-deploy
- [ ] Push to `main`, verify live on `islemkobbi.github.io`
- [ ] Add Google Analytics (optional, `gtag.js`)

---

## 11. JSON SCHEMAS — QUICK REFERENCE

### `data/profile.json`
```json
{
  "name": "Islem KOBBI",
  "title": "PhD Researcher · Autonomous Driving · Reinforcement Learning",
  "institution": "INRIA Paris — ASTRA Team",
  "bio": "I build motion planners that teach autonomous vehicles to navigate the world safely — using reinforcement learning and closed-map self-play.",
  "photo": "assets/img/profile.jpg",
  "cv": "assets/docs/CV_KOBBI.pdf",
  "email": "islem.kobbi@inria.fr",
  "location": "Paris, France",
  "links": {
    "github": "https://github.com/islemkobbi",
    "linkedin": "https://linkedin.com/in/islem-kobbi",
    "scholar": ""
  },
  "stats": [
    { "value": 2, "label": "Publications" },
    { "value": 3, "label": "Years Research" },
    { "value": 3, "label": "Languages" },
    { "value": 2, "label": "Degrees" }
  ]
}
```

### `data/skills.json`
```json
{
  "bars": [
    { "name": "Python", "level": 92 },
    { "name": "PyTorch / Deep Learning", "level": 85 },
    { "name": "Reinforcement Learning", "level": 88 },
    { "name": "C / C++", "level": 65 },
    { "name": "ROS / Gazebo", "level": 75 },
    { "name": "Computer Vision (OpenCV)", "level": 80 }
  ],
  "categories": [
    {
      "label": "AI / ML",
      "tags": ["PyTorch", "Keras", "TensorFlow", "scikit-learn", "XGBoost", "OpenCV", "NumPy", "Pandas", "SciPy"]
    },
    {
      "label": "Simulation & Robotics",
      "tags": ["ROS", "Gazebo", "CARLA", "Docker", "Linux"]
    },
    {
      "label": "Languages",
      "tags": ["Python", "C++", "Java", "JavaScript", "Git"]
    },
    {
      "label": "Web & Tools",
      "tags": ["Django", "NodeJS", "HTML/CSS", "MATLAB", "Blender"]
    }
  ]
}
```

---

## 12. ESTIMATED BUILD TIME

| Phase | Task | Time |
|---|---|---|
| 1 | Foundation + Canvas | ~6h |
| 2 | Content system + JSON | ~4h |
| 3 | Styling + Animations | ~8h |
| 4 | Admin tool | ~4h |
| 5 | QA + Launch | ~3h |
| **Total** | | **~25h** |

At a $400/hr agency rate, this is a ~$10,000 engagement. The code will be yours, maintainable, and zero ongoing cost (GitHub Pages is free).

---

*Plan written for Islem KOBBI — INRIA Paris, June 2026*