# SRM Toolkit — PYQs & Academia Portal 🎓

🔗 **Live Website**: [https://srm-pyq.vercel.app/](https://srm-pyq.vercel.app/)

A modern, fast, and comprehensive web application designed for SRM Institute of Science and Technology (SRMIST) students. Browse curated Previous Year Questions (PYQs) with math formulas and code snippets, and access student Academia portal data (attendance, timetable, marks, and profile) through a single unified interface.

---

## ✨ Features

### 📚 1. PYQ Question Bank & Study Resources
- **Organized by Course & Semester**: Browse question banks mapped to official SRM course codes.
- **Rich LaTeX Math & Formula Rendering**: Formulas, matrices, and expressions rendered cleanly via **KaTeX**.
- **Code Syntax Highlighting**: Multi-language code snippets with **PrismJS**.
- **Instant Search & Filter**: Search questions by keyword, topic, unit, semester, or course code.
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

### 🏛️ 2. SRM Academia Student Portal Integration
- **Direct Login / Session Management**: Authenticate securely using your SRM Academia portal credentials.
- **Attendance Tracker**: View overall and subject-wise attendance percentages with margin calculations.
- **Timetable & Day Order**: Check daily class schedule, batch details, and active day order.
- **Internal Marks & Results**: View test marks, internal assessments, and GPA.
- **Student Profile**: Quick overview of registration number, program, semester, and personal details.

### 🎨 3. Modern User Experience
- **Dark Mode**: Seamless toggle between light and dark themes with persistent user preference.
- **Responsive Layout**: Optimized for mobile, tablet, and desktop screens.
- **Analytics Ready**: Google Analytics (`gtag.js`) integrated with configurable measurement IDs.

---

## 🛠️ Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) |
| **Math & Code Rendering** | [KaTeX](https://katex.org/), [PrismJS](https://prismjs.com/) |
| **Backend API** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [reddy-api-srm](https://www.npmjs.com/package/reddy-api-srm), [tsx](https://github.com/privatenumber/tsx) |
| **Analytics** | Google Analytics (`gtag.js`) |

---

## 📁 Project Structure

```text
SRM-PYQ/
├── backend/                  # Express API server (Academia portal proxy)
│   ├── src/
│   │   └── index.ts          # API endpoints & authentication routes
│   ├── .env.example          # Backend environment variables template
│   ├── package.json
│   └── tsconfig.json
├── public/
│   ├── data/                 # JSON question banks organized by course code
│   │   ├── 21CSC101T/
│   │   ├── 21CSC201J/
│   │   ├── 21CSS201T/
│   │   └── ...
│   └── scripts/              # Data extraction & scraper scripts
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with font setup & Google Analytics
│   │   ├── page.tsx          # Main page tabs (PYQ & Student Data)
│   │   └── globals.css       # Tailwind & styling rules
│   ├── components/
│   │   ├── PyqSection.tsx    # PYQ question browser and viewer
│   │   └── StudentDataSection.tsx # Academia portal dashboard
│   ├── hooks/
│   │   └── useDarkMode.ts    # Dark/light theme state hook
│   └── lib/                  # Utilities and helpers
├── .env.example              # Next.js frontend environment template
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

Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

**Frontend (`.env.local`)**:
Create a `.env.local` file in the root directory based on `.env.example`:
```bash
cp .env.example .env.local
```
```env
# Backend API Base URL
NEXT_PUBLIC_SRM_API_BASE=http://localhost:5000

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-MDJ7KNDKMV
```

**Backend (`backend/.env`)**:
Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```
```env
PORT=5000
```

---

## 💻 Running the Application

You can run both the frontend and backend simultaneously or start them individually.

### Option A: Run Both Together (Recommended)
```bash
npm run dev:all
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### Option B: Run Individually

**Terminal 1 — Next.js Frontend:**
```bash
npm run dev
```

**Terminal 2 — Express Backend:**
```bash
npm run dev:backend
```

---

## 📜 Available Scripts

In the root directory, you can run:

- `npm run dev`: Starts the Next.js frontend with Turbopack.
- `npm run dev:backend`: Starts the backend API using `tsx watch`.
- `npm run dev:all`: Starts both frontend and backend concurrently.
- `npm run build`: Builds the production bundle for Next.js.
- `npm run start`: Runs the built Next.js production server.
- `npm run lint`: Runs ESLint checks.

---

## 🔒 Privacy & Security

- SRM Academia credentials entered in the **Student data** tab are sent directly to the local backend proxy to communicate with the official Academia portal.
- Credentials and session cookies are never stored on external databases or shared with third parties.

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
