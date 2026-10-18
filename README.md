# SkillSwap – A Peer-to-Peer Skill Exchange and Collaborative Learning Platform Using Hybrid Recommendation Techniques

> **College Prototype Development Lab Project**  
> **Lead Developer:** Sanjeeviraj  
> **Technology Stack:** HTML5, CSS3 (Custom Dark SaaS UI), Vanilla JavaScript, Node.js, Express.js, MongoDB (Mongoose), Python (FastAPI, Scikit-Learn, NumPy, Pandas).

---

## 📖 1. Project Overview

**SkillSwap** is a full-stack, responsive web application enabling university students and peers to exchange technical and creative skills in a reciprocal bilateral model. Rather than paying high hourly tutoring fees, users exchange what they already know (e.g. *Python Programming*, *Machine Learning*) in return for learning domains they wish to master (e.g. *UI/UX Design in Figma*, *Cloud Architecture & Docker*).

The platform pairs students using a **Python-powered Hybrid Recommendation Microservice** that evaluates:
1. **Reciprocal Skill Compatibility (50% weight):** Matches bilateral trade symmetry where User A teaches what User B wants to learn, and User B teaches what User A wants to learn.
2. **Semantic Text Similarity (25% weight):** Uses Scikit-Learn's `TfidfVectorizer` and Cosine Similarity to compare academic biographies, research interests, and learning objectives.
3. **Availability Schedule Overlap (15% weight):** Jaccard index of overlapping study availability slots.
4. **Learning Format & Proficiency Preference (10% weight):** Alignment of format (Online, In-Person campus labs, or Flexible) and proficiency synergy.

---

## 🎨 2. Design System & User Interface

- **Theme:** Deep charcoal (`#090a10`, `#0f121d`) and midnight black.
- **Accents:** Electric Violet (`#8b5cf6`, `#7c3aed`) and Bright Cyan (`#22d3ee`, `#06b6d4`).
- **Aesthetic:** Modern dark-mode SaaS dashboard with glassmorphism, subtle glowing borders, and backdrop blurs.
- **Micro-Interactions & Animations:** CSS keyframes, card hover lift, dynamic counter animations, and `IntersectionObserver` scroll reveals with `@media (prefers-reduced-motion: reduce)` accessibility support.
- **Framework-Free Frontend:** Clean semantic HTML5, modular CSS3, and standard Vanilla JavaScript without React, Vue, or Angular.

---

## 📂 3. Repository Architecture

```text
Skill swap/
├── backend/
│   ├── config/
│   │   └── db.js                        # MongoDB Mongoose connection handler
│   ├── controllers/
│   │   ├── authController.js            # Registration, login, JWT & OAuth status
│   │   ├── userController.js            # Profiles, skills, and dashboard stats
│   │   ├── skillController.js           # Live search, categories, and tags
│   │   ├── partnerController.js         # Connects to AI recommender + relationship check
│   │   ├── requestController.js         # Proposal lifecycle (send, accept, decline, cancel)
│   │   ├── sessionController.js         # Scheduling, completion, and room coordination
│   │   ├── feedbackController.js        # Star reviews, transparent points rule, leaderboard
│   │   ├── notificationController.js    # Unread counter and notification feed
│   │   └── contactController.js         # MongoDB contact inquiry persistence
│   ├── middleware/
│   │   ├── auth.js                      # JWT Bearer & HTTP-only cookie auth guard
│   │   └── errorHandler.js              # Centralized JSON error middleware
│   ├── models/
│   │   ├── User.js                      # User schema with bcrypt hashing & skills arrays
│   │   ├── Skill.js                     # Directory skills catalog
│   │   ├── SkillExchangeRequest.js      # Exchange proposal state machine
│   │   ├── LearningSession.js           # Scheduled session management
│   │   ├── Feedback.js                  # Peer reviews, ratings & points audit
│   │   ├── Notification.js              # Activity alert feed
│   │   └── ContactMessage.js            # Contact form inquiries
│   ├── routes/                          # Express REST API routes
│   ├── services/
│   │   └── recommendationService.js     # Python FastAPI client + fault-tolerant heuristic fallback
│   ├── seed.js                          # Database seeder with realistic student personas
│   ├── server.js                        # Main Express server entrypoint
│   ├── test-api.js                      # Automated REST API verification suite
│   ├── package.json
│   └── .env.example
├── recommendation-service/
│   ├── main.py                          # FastAPI microservice endpoints (/health, /recommend)
│   ├── recommender.py                   # HybridRecommender class (TF-IDF + Cosine + Weights)
│   ├── requirements.txt                 # Python dependencies
│   └── .env.example
├── frontend/
│   ├── index.html                       # Landing page with interactive hero & stats
│   ├── login.html                       # Auth with email/pass, OAuth hooks & 1-click Demo mode
│   ├── dashboard.html                   # Personalized dashboard with metrics & quick actions
│   ├── profile.html                     # Profile editor & skill proficiency manager
│   ├── explore.html                     # Searchable directory with live category filters
│   ├── partners.html                    # AI partner matching interface with score breakdown
│   ├── requests.html                    # Exchange request management (incoming & outgoing)
│   ├── sessions.html                    # Session calendar, scheduling modal & summaries
│   ├── feedback.html                    # Peer review system, skill points rules & leaderboard
│   ├── notifications.html               # Real-time activity center with unread filter
│   ├── about.html                       # Project objectives, architecture formula & contact form
│   ├── css/
│   │   ├── main.css                     # Design tokens, variables & typography
│   │   ├── components.css               # Navbar, footer, modals, cards, tabs, and toasts
│   │   └── animations.css               # Keyframes, glow pulses, and scroll reveals
│   └── js/
│       ├── api.js                       # Centralized API fetch wrapper, toasts & modals
│       ├── auth.js                      # Session manager & page route guards
│       ├── navbar.js                    # Navbar, mobile drawer & footer injector
│       └── [page-specific scripts]
├── .gitignore
└── README.md
```

---

## ⚙️ 4. Prerequisites & Installation

### 4.1 Prerequisites
- **Node.js** v18+ or v20+ / v24+
- **Python** 3.10+ / 3.11+ / 3.12+
- **MongoDB** (Local instance on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

---

### 4.2 Backend Setup (Node.js & Express)

1. Open PowerShell or Terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
4. Configure your `.env` variables if necessary:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/skillswap
   JWT_SECRET=skillswap_super_secret_jwt_key_2026_dev_mode
   RECOMMENDER_SERVICE_URL=http://127.0.0.1:8000
   ```
5. Seed initial realistic student personas and skills:
   ```bash
   npm run seed
   ```
6. Start the Express server:
   ```bash
   npm start
   ```
   *The backend server will run on `http://localhost:5000`.*

---

### 4.3 Python Recommendation Microservice Setup

1. Open a new terminal in `recommendation-service/`:
   ```bash
   cd recommendation-service
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # macOS / Linux:
   source venv/bin/activate
   ```
3. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI microservice:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The recommendation service will be live on `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

---

### 4.4 Running the Frontend

The Express server serves the static frontend directly from `http://localhost:5000` or you may use VS Code Live Server on `http://127.0.0.1:5500`:
- **Web App Home:** `http://localhost:5000/index.html`
- **Dashboard:** `http://localhost:5000/dashboard.html`
- **Explore Skills:** `http://localhost:5000/explore.html`
- **Find Partners:** `http://localhost:5000/partners.html`
- **About & Architecture:** `http://localhost:5000/about.html`

---

## 🧪 5. Testing & Verification

Run the automated test suite to verify all endpoints, database connections, and authentication flows:
```bash
cd backend
npm test
```
The test suite validates:
- API health check (`/api/health`)
- Local authentication and JWT issuance (`/api/auth/login`)
- Profile retrieval and update (`/api/users/profile`)
- Skills directory search and categorization (`/api/skills`)
- AI Partner Recommendations (`/api/partners/recommendations`)
- Contact form persistence into MongoDB (`/api/contact`)
- Transparent points leaderboard (`/api/feedback/leaderboard`)

---

## 🔑 6. OAuth Configuration (Google, GitHub, LinkedIn)

SkillSwap supports official OAuth 2.0 flows. If credentials are not yet configured in `.env`, the system automatically activates a clearly labeled **Evaluation Lab Demo Mode** so professors and reviewers can test immediately without setting up external API keys.

To enable live production OAuth:
1. **Google OAuth 2.0:**
   - Create credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Set Authorized Redirect URI: `http://localhost:5000/api/auth/google/callback`.
   - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`.
2. **GitHub OAuth:**
   - Register a new OAuth App at [GitHub Developer Settings](https://github.com/settings/developers).
   - Set Callback URL: `http://localhost:5000/api/auth/github/callback`.
   - Update `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `backend/.env`.
3. **LinkedIn OAuth 2.0:**
   - Create an app on [LinkedIn Developer Portal](https://developer.linkedin.com/).
   - Add OpenID Connect and Sign In with LinkedIn products.
   - Set Redirect URL: `http://localhost:5000/api/auth/linkedin/callback`.
   - Update `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in `backend/.env`.

---

## 🏆 7. Transparent Skill Points Merit System

SkillSwap implements a documented point economy to prevent grade inflation and encourage constructive peer feedback:
- **Base Completion (+30 Points):** Awarded to both participants upon marking a scheduled study session complete.
- **Rating Quality Bonus (Up to +20 Points):** Awarded to the teaching partner:
  - 5 Stars: `+20 Bonus Points` (Total `50 pts`)
  - 4 Stars: `+15 Bonus Points` (Total `45 pts`)
  - 3 Stars: `+10 Bonus Points` (Total `40 pts`)
  - 2 Stars: `+5 Bonus Points` (Total `35 pts`)
  - 1 Star: `+0 Bonus Points` (Total `30 pts`)
- **Reviewer Contribution (+15 Points):** Awarded to the reviewer for submitting constructive peer review criteria (Clarity, Punctuality, Helpfulness).

---

## 🛡️ 8. Security & Best Practices

- **Password Hashing:** Implemented with `bcryptjs` (salt rounds: 10). Passwords are never stored or logged in plaintext.
- **Token Security:** Signed JSON Web Tokens (JWT) with configurable expiration (`7d`).
- **HTTP-Only Cookies & Bearer Headers:** Dual-mode authentication support for modern browser sessions and API tools.
- **Rate Limiting:** Protects `/api/auth/login` and `/api/auth/register` against brute-force attacks via `express-rate-limit`.
- **Fault-Tolerant Microservice Bridge:** If the Python FastAPI microservice is offline, the Node.js backend seamlessly executes an internal heuristic matcher with identical mathematical weighting, ensuring zero platform downtime.
- **Input Sanitization:** Regex-based validation on emails and bounds checking on session durations and rating scores.

---

## 👨‍💻 Developer Credit

- **Project:** SkillSwap – Peer-to-Peer Collaborative Learning Platform
- **Lead Developer:** Sanjeeviraj
- **Academic Context:** Prototype Development Lab
- **Year:** 2026
