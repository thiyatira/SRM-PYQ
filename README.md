# SRM StudyHub — Previous Year Question Papers 🎓

🔗 **Live Website**: [https://srm-pyq.vercel.app/](https://srm-pyq.vercel.app/)

A modern, fast, and comprehensive web application designed for SRM Institute of Science and Technology (SRMIST) students. Browse curated Previous Year Questions (PYQs) with math formulas and code snippets.

---

## ✨ Features

### 📚 1. PYQ Question Bank & Study Resources
- **Organized by Course & Semester**: Browse question banks mapped to official SRM course codes.
- **Rich LaTeX Math & Formula Rendering**: Formulas, matrices, and expressions rendered cleanly via **KaTeX**.
- **Code Syntax Highlighting**: Multi-language code snippets with **PrismJS**.
- **Instant Search & Filter**: Search questions by keyword, topic, unit, semester, or course code.
- **Interactive MCQs**: Multiple-choice questions show lettered options you can tap; the right answer turns green (and a wrong pick red) with the explanation. Filter by **All / MCQ / Written**.
- **Curated Subjects**:
  - `21CSS101J` — Programming for Problem Solving (PPS)
  - `21CSS201T` — Computer Organization & Architecture (COA)
  - `21CSC101T` — Object Oriented Design & Programming (OODP)
  - `21CSC201J` — Data Structures & Algorithms (DSA)
  - `21CSC203P` — Advanced Programming Practice (APP)
  - `21MAB102T` — Advanced Calculus & Complex Analysis
  - `21PYB102J` — Semiconductor Physics
  - `21CYB101J` — Chemistry
  - `21EES101T` — Basic Electrical & Electronics Engineering (BEEE)
  - `21BTB102T` — Biology
  - `21GNH101J` — Philosophy / Constitution
  - `21LEH101T` / `21LEH103T` — Communicative English & German

### 🎨 2. Modern User Experience
- **Dark Mode**: Seamless toggle between light and dark themes with persistent user preference.
- **Responsive Layout**: Optimized for mobile, tablet, and desktop screens.
- **Accessible**: Skip-to-content link, keyboard focus rings, and `aria-pressed` state on the theme control.
- **Shareable Links**: Copy a link to any question (`#pyq/<course>/<id>`); bookmarks are stored locally.
- **Optional Analytics**: Google Analytics (`gtag.js`) loads only when `NEXT_PUBLIC_GA_ID` is set.

---

## 🛠️ Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) |
| **Math & Code Rendering** | [KaTeX](https://katex.org/), [PrismJS](https://prismjs.com/) |
| **Analytics** | Google Analytics (`gtag.js`) |

---

## 📁 Project Structure

```text
SRM-PYQ/
├── backend/                  # Standalone Academia API proxy (not used by this app; see note below)
│   ├── src/
│   │   └── index.ts          # API endpoints & authentication routes
│   ├── .env.example          # Backend environment variables template
│   ├── package.json
│   └── tsconfig.json
├── public/
│   ├── data/                 # JSON question banks, one folder per course code (papers are discovered automatically)
│   │   ├── 21CSC101T/
│   │   ├── 21CSC201J/
│   │   ├── 21CSS201T/
│   │   └── ...
│   └── scripts/              # Data extraction & scraper scripts
├── scripts/
│   ├── validate-data.mjs     # Validates the JSON question banks (npm run validate:data)
│   └── mcqify.mjs            # Converts old-style MCQs (options typed in the question) to options/correct_option
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout: fonts, metadata, theme init script, optional GA
│   │   ├── page.tsx          # Main page: header, PYQ browser, footer
│   │   ├── error.tsx         # Error boundary
│   │   ├── not-found.tsx     # 404 page
│   │   └── globals.css       # Tailwind & styling rules
│   ├── components/
│   │   ├── PyqSection.tsx    # PYQ question browser and viewer
│   │   └── pyq/              # Browse, search, question cards, helpers
│   ├── hooks/
│   │   └── useDarkMode.ts    # Dark/light theme hook (hydration-safe)
│   └── lib/                  # Utilities and helpers
├── .env.example              # Next.js frontend environment template
├── LICENSE                   # MIT License
├── next.config.ts            # Next.js configuration
├── tailwind.config.js        # Tailwind styling configuration
└── package.json              # Root dependencies and workspace scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18+ or v20+ recommended
- **npm** or **pnpm** / **yarn** / **bun**

### 1. Install Dependencies

Install root (frontend) dependencies:
```bash
npm install
```

### 2. Configure Environment Variables

Optionally create a `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```
```env
# Google Analytics (Optional) - analytics is disabled when unset
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 💻 Running the Application

```bash
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000).

---

## 📜 Available Scripts

In the root directory, you can run:

- `npm run dev`: Starts the Next.js frontend with Turbopack.
- `npm run build`: Builds the production bundle for Next.js.
- `npm run start`: Runs the built Next.js production server.
- `npm run lint`: Runs ESLint checks.
- `npm run typecheck`: Runs the TypeScript compiler without emitting files (`tsc --noEmit`).
- `npm run validate:data`: Validates the JSON question banks under `public/data`.

---

## 🔒 Privacy

- The app is fully static on the client: no accounts, no logins, no server-side storage. Bookmarks and theme preference are kept in your browser's `localStorage`.
- Question text is HTML-escaped before rendering; only KaTeX and Prism output is injected.

> **Note:** `backend/` contains a separate Academia (attendance/timetable) API proxy. It is not wired into this app's UI and can be developed and deployed independently.

---

## 🤝 Contributing

Contributions are warmly welcomed!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AddSubjectPYQ`).
3. Commit your changes (`git commit -m 'Add question bank for subject XYZ'`).
4. Push to the branch (`git push origin feature/AddSubjectPYQ`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
