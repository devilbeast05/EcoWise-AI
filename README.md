# EcoWise AI — Personal Carbon Footprint Assistant

EcoWise AI is a production-ready, full-stack web application designed to help individuals calculate, track, simulate, and reduce their daily carbon footprints through AI-generated behavioral insights and simple lifestyle changes.

---

## 1. Problem Statement
The average individual is aware of climate change but lacks clear visibility into which daily habits (e.g., commute, food, heating) dominate their personal carbon footprint. EcoWise AI resolves this by:
- Creating a unified tracking dashboard.
- Offering interactive lifestyle scenario simulation (Carbon Twin).
- Providing context-aware coaching advice utilizing Gemini AI.
- Scanning utility bills automatically using OCR.

---

## 2. Core Features
- **Feature 1 — User Authentication**: Secure registration and login powered by JWT tokens and native bcrypt password hashing.
- **Feature 2 — Carbon Tracker**: Log daily activities across Transportation (Car, Bus, Train, Metro, Flight, Bicycle), Home Energy (Electricity, LPG, Solar), Food (Vegan, Vegetarian, Non-vegetarian), and Waste (Recycled, Non-recycled).
- **Feature 3 — Carbon Dashboard**: Rich visual analysis utilizing Recharts, displaying monthly breakdowns, trend lines, and carbon budgets.
- **Feature 4 — AI Carbon Coach**: Gemini 1.5 Flash generates specific, actionable suggestions based on personal tracking history.
- **Feature 5 — Carbon Twin Simulator**: Adjust sliders (car usage, diet, solar panels, power reduction) to calculate savings and compare current vs. projected footprint in real-time.
- **Feature 6 — Smart Goals**: Configure monthly or quarterly carbon budgets and earn achievements (e.g., "Eco Starter", "Goal Crusher").
- **Feature 7 — Bill Scanner**: Scan utility electricity bill images using OCR (Tesseract + Gemini Multimodal Vision fallback) to extract usage stats automatically.
- **Feature 8 — Weekly Report & PDF Export**: Compile a weekly sustainability audit narrative and export it as a print-ready PDF file.
- **Bonus — EcoBuddy AI Chat**: Interactive persistent chatbot to answer eco-questions on the fly.

---

## 3. Technology Stack
- **Frontend**: React (v19), TypeScript, TailwindCSS (v3), Recharts, Lucide Icons, Vite
- **Backend**: FastAPI, SQLAlchemy, Bcrypt, PyJWT, Pillow, ReportLab, PyTest
- **Database**: SQLite (local development), PostgreSQL (production-ready)
- **AI / OCR**: Gemini 1.5 Flash API, Tesseract OCR

---

## 4. Setup Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Tesseract OCR (Optional: Fallback system uses Gemini Vision if not installed)

### Backend Configuration
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install --prefer-binary -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   copy .env.example .env
   ```
5. Configure `.env` with your `GEMINI_API_KEY` (Get one from [Google AI Studio](https://aistudio.google.com/)).
6. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API docs will be active at `http://localhost:8000/docs`.

### Frontend Configuration
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 5. API Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | Registers a new account | No |
| **POST** | `/api/auth/login` | Validates credentials and returns JWT token | No |
| **GET** | `/api/auth/profile` | Fetches active profile details | Yes |
| **GET** | `/api/activities/` | Retrieves all logged activity records | Yes |
| **POST** | `/api/activities/` | Saves a new carbon footprint activity | Yes |
| **DELETE** | `/api/activities/{id}` | Deletes a logged activity | Yes |
| **GET** | `/api/activities/dashboard` | Compiles dashboard aggregations | Yes |
| **GET** | `/api/goals/` | Fetches monthly/quarterly goals progress | Yes |
| **POST** | `/api/goals/` | Commits a new budget limit goal | Yes |
| **GET** | `/api/goals/badges` | List of earned milestone badges | Yes |
| **GET** | `/api/coach/recommendations` | Gemini recommendations | Yes |
| **POST** | `/api/coach/simulate` | Evaluates simulator slider scenario | Yes |
| **GET** | `/api/coach/weekly-report` | Generates weekly report JSON | Yes |
| **GET** | `/api/coach/weekly-report/pdf` | Downloads Weekly report as PDF | Yes |
| **POST** | `/api/coach/chat` | Chat message endpoint for EcoBuddy | Yes |
| **POST** | `/api/scanner/scan` | OCR image scanning and details extraction | Yes |

---

## 6. Running Tests
We use PyTest to verify all calculations, auth cycles, and simulation equations:
```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest.exe tests/
```

---

## 7. Deployment Guide

### Backend (Render)
1. Deploy as a Web Service on Render.
2. Select Environment: **Python**.
3. Set Build Command: `pip install -r requirements.txt`.
4. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: Random secure string.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.

### Frontend (Vercel)
1. Import your repository into Vercel.
2. Set Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Deploy!
