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
## Project Structure

```text
personal-finance-advisor-bot/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── app.js



```


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


``

### Personal Finance Advisor Bot 💰

An AI-style personal finance assistant built with **Python, Flask, SQLite and JavaScript**.
```
## Features
- Income and expense tracking
- Category-wise spending analysis
- Budget overview and savings estimate
- AI-style personalized financial insights
- Monthly financial summary
- Responsive dashboard UI
- SQLite database for persistent local data
- Demo/fallback advisor mode that works without an external AI API

```
## Project Documentation

📄[ https://github.com/harshpatil-ai/personal-finance-advisor-bot/blob/3acffbbc70ef5a73271c31f829e6329df39d4f5c/Personal_Finance_Advisor_Bot_%20document_final.pdf ]
