# Personal Finance Advisor Bot 💰
### Smart Budgeting & AI-Driven Savings Insights

A modern, full-stack personal finance web application built for college students, interns, and young professionals. It combines **real-time transaction logging**, **dynamic category expense analytics**, **automated AI-style savings guidance**, and **monthly budget tracking** in an intuitive, responsive dashboard.

---

## 🌟 Key Highlights

- **Full-Stack Architecture**: Clean, decoupled REST API built with Python Flask and SQLite, backed by a responsive vanilla HTML5, CSS3, and JavaScript frontend.
- **Dynamic Financial Dashboard**: Live calculation of Total Income, Total Expenses, and Remaining Balance.
- **AI Financial Insight Engine 🤖**: Intelligent rule-based evaluation that assesses expense-to-income ratios, calculates financial health scores (0–100), detects top spending risk categories, and provides 50/30/20 budgeting advice.
- **Visual Expense Breakdown**: Real-time proportional category progress bars (Food, Rent, Transport, Education, Shopping, Entertainment, Healthcare, etc.).
- **Monthly Budget Planner**: Interactive budget limit setter with dynamic color-coded utilization progress bars (Safe, Warning, Deficit).
- **1-Click Demo Data Loader ⚡**: Pre-loaded with realistic college student financial records (₹25,000 Stipend, Food, Transport, Books, Shopping) for instant demonstration during vivas.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+ / Flask | RESTful API endpoints, request validation, business logic |
| **Database** | SQLite3 (`finance.db`) | Relational transaction ledger with ACID compliance |
| **Frontend** | HTML5 Semantic Elements | Accessible and responsive document structure |
| **Styling** | CSS3 (Custom Variables & Grid) | Modern card design, soft shadows, responsive typography |
| **Client Logic**| Vanilla JavaScript (ES6+) | Asynchronous `fetch` calls, DOM updates, progress tracking |

---

## 📁 Project Folder Structure

```text
personal-finance-advisor-bot/
├── app.py                     # Flask REST API backend & database initialization
├── requirements.txt           # Python package dependencies (Flask)
├── test_app.py                # Automated backend test suite (6 unittests)
├── START_APP.bat              # 1-Click double-clickable Windows launcher
├── README.md                  # Comprehensive documentation and viva presentation guide
├── .gitignore                 # Excludes caches and local database files
├── finance.db                 # SQLite database pre-seeded with sample records
├── templates/
│   └── index.html             # Responsive single-page dashboard
└── static/
    ├── style.css              # Custom styling (white cards, light gray bg, responsive grid)
    └── app.js                 # Frontend API controller, charts & budget tracker
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.10 or higher installed on your system.
- Web browser (Google Chrome, Microsoft Edge, Firefox, or Safari).

### Option 1: 1-Click Launch (Windows)
Double-click:
`START_APP.bat`

### Option 2: Terminal or PowerShell
Navigate to the project folder:
```bash
cd personal-finance-advisor-bot
```

Install required packages:
```bash
pip install -r requirements.txt
```
*(On Windows systems with multiple Python versions, use `py -3.13 -m pip install -r requirements.txt`)*

Run the application:
```bash
python app.py
```
*(Or `py app.py` / `py -3.13 app.py`)*

Open your browser and visit:
```
http://127.0.0.1:5000
```

---

## 🧪 Running Automated Tests

A comprehensive unit test suite is included to verify all API endpoints and database operations:

```bash
python test_app.py
```

**Test Coverage:**
- Health check verification (`GET /health`)
- Main page template rendering (`GET /`)
- Adding income and expense transactions (`POST /api/transactions`)
- Transaction validation (rejecting negative amounts or invalid categories)
- Dynamic summary calculations (`GET /api/summary`)
- AI financial advice heuristics (`GET /api/advice`)
- Demo data injection (`POST /api/demo-data`)

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves the main application UI | None |
| `GET` | `/health` | Application health status | None |
| `GET` | `/api/transactions` | Returns all recorded transactions (newest first) | None |
| `POST`| `/api/transactions` | Creates a new income or expense transaction | `{"kind": "income"\|"expense", "category": "Food", "amount": 1200, "note": "Dinner"}` |
| `DELETE`| `/api/transactions/<id>` | Deletes a transaction by ID | None |
| `GET` | `/api/summary` | Calculates income, expenses, balance, and category breakdown | None |
| `GET` | `/api/advice` | AI advice text, health score (0–100), and savings benchmarks | None |
| `POST`| `/api/demo-data` | Injects sample viva presentation dataset (₹25k income + 4 expenses) | None |
| `POST`| `/api/reset-data` | Clears all transactions from the database | None |
| `POST`| `/api/contact` | Handles project inquiry form submissions | `{"name": "...", "email": "...", "message": "..."}` |

---

## 🎤 Viva / Demo Presentation Script

When demonstrating this project to an external examiner, professor, or review panel, follow this workflow:

1. **Step 1 - Landing Page**: Open `http://127.0.0.1:5000`. Highlight the clean, modern student dashboard design, navigation bar, and responsive typography.
2. **Step 2 - Hero Section**: Explain the purpose: *"Personal Finance Advisor Bot combines budgeting, ledger tracking, and AI-driven heuristics into a student-friendly platform."*
3. **Step 3 - Navigate to Dashboard**: Click **"Open Dashboard"** button (smooth scrolls directly to the dashboard).
4. **Step 4 - Explain KPI Cards**: Point out the three core cards: **Total Income** (Green), **Total Expenses** (Red), and **Remaining Balance** (Blue).
5. **Step 5 - Load Demo Data (Optional / Recommended)**: Click **"⚡ Load Demo Data"** to instantly populate ₹25,000 Internship Stipend and 4 student expense categories (Food, Transport, Education, Shopping).
6. **Step 6 - Add a Manual Transaction**: Demonstrate adding an expense:
   - Select **Expense**
   - Category: **Entertainment**
   - Amount: **₹800**
   - Note: *"Movie night with friends"*
   - Click **Add Transaction**. Show the success toast and immediate live balance recalculation.
7. **Step 7 - Verify Balance Updates**: Show that Remaining Balance immediately decreased by ₹800.
8. **Step 8 - Recent Transactions Table**: Point out the ledger:
   - Green pills for income, Red pills for expenses.
   - Newest transactions appear at the top.
   - Filter transactions using the search input.
9. **Step 9 - AI Financial Insight 🤖**: Point out the AI bot speech bubble:
   - Explain the rule engine: evaluates expense percentage, assigns a Financial Health Score (e.g., 75/100), and flags the highest spending risk category.
   - Reference the **50/30/20 Budgeting Rule** displayed on the card.
10. **Step 10 - Expense Analysis**: Show the visual horizontal progress bars illustrating category spending percentages.
11. **Step 11 - Monthly Budget Planner**: Show the budget tracker:
    - Monthly Budget: ₹20,000.
    - Used: ₹11,100 / ₹20,000 (55.5%).
    - Progress bar dynamically adjusts its color (Green → Yellow → Red if overbudget).
12. **Step 12 - System Architecture**: Scroll to **Project Architecture** and explain the flow:
    `User ➔ Frontend ➔ Flask REST API ➔ SQLite Database ➔ AI Heuristics ➔ Dashboard`.

---

## ❓ Common Viva Questions & Answers

### Q1: Why did you choose SQLite over MySQL or MongoDB?
> **Answer**: SQLite is serverless, zero-configuration, and self-contained within a single file (`finance.db`). It provides full ACID transaction guarantees without requiring a separate database daemon process. For a personal finance tracker, it ensures privacy by keeping all financial records local to the user's computer.

### Q2: How does the AI Financial Advisor make decisions?
> **Answer**: The AI engine in `app.py` implements rule-based financial heuristics:
> - **Deficit Check**: If expenses > income, it triggers a critical alert and calculates the exact monthly shortfall.
> - **Ratio Evaluation**:
>   - High Risk (>80% of income): Warns the user to cut discretionary spending and flags the highest spending category.
>   - Moderate (50%–80%): Advises saving 10%–20% and highlights the largest expense category.
>   - Healthy (<50%): Commends spending control and recommends building an emergency fund.
> - **Health Score Metric**: Calculates a weighted score from 0 to 100 based on savings rate and expense-to-income balance.

### Q3: How is client-server communication handled?
> **Answer**: The application uses a decoupled REST architecture. The frontend sends asynchronous HTTP requests via the browser's `fetch()` API with JSON payloads (`application/json`). The Flask backend processes the request and responds with structured JSON containing status codes (`200`, `201`, `400`, `500`).

---

## 📦 GitHub Submission Instructions

To push this project to your GitHub repository:

```bash
# 1. Initialize git repository
git init

# 2. Add all project files
git add .

# 3. Commit changes
git commit -m "Initial commit: Personal Finance Advisor Bot full stack application"

# 4. Link your remote GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/personal-finance-advisor-bot.git

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

---

## 📄 License & Disclaimer
This project is open-source under the MIT License. Developed for educational, academic, and seminar presentation purposes.
