from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)
DB = "finance.db"

def init_db():
    con = sqlite3.connect(DB)
    con.execute("""CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
    )""")
    con.commit()
    con.close()

def get_transactions():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT * FROM transactions ORDER BY id DESC").fetchall()
    con.close()
    return [dict(row) for row in rows]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/transactions", methods=["GET", "POST"])
def transactions():
    if request.method == "GET":
        return jsonify(get_transactions())
    data = request.get_json() or {}
    kind = data.get("kind")
    category = str(data.get("category", "")).strip()
    note = str(data.get("note", "")).strip()
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        amount = 0
    if kind not in ("income", "expense") or not category or amount <= 0:
        return jsonify({"error": "Invalid transaction"}), 400
    con = sqlite3.connect(DB)
    con.execute(
        "INSERT INTO transactions(kind, category, amount, note, created_at) VALUES (?, ?, ?, ?, ?)",
        (kind, category, amount, note, datetime.now().strftime("%Y-%m-%d %H:%M"))
    )
    con.commit()
    con.close()
    return jsonify({"message": "Transaction added successfully"}), 201

@app.route("/api/summary")
def summary():
    rows = get_transactions()
    income = sum(r["amount"] for r in rows if r["kind"] == "income")
    expense = sum(r["amount"] for r in rows if r["kind"] == "expense")
    return jsonify({"income": round(income,2), "expense": round(expense,2), "balance": round(income-expense,2)})

@app.route("/api/advice")
def advice():
    rows = get_transactions()
    income = sum(r["amount"] for r in rows if r["kind"] == "income")
    expense = sum(r["amount"] for r in rows if r["kind"] == "expense")
    if income == 0 and expense == 0:
        text = "Add your income and expenses to receive a personalized financial insight."
    elif income <= 0:
        text = "Add your regular income so the advisor can calculate your budget and savings."
    elif expense / income > 0.80:
        text = "Your expenses are above 80% of income. Review non-essential spending and keep some money aside for savings."
    elif expense / income > 0.60:
        text = "Your spending is moderate. Review your largest expense category and consider saving 10–20% of your income."
    else:
        text = "Good spending control. Keep essential expenses stable and consider building an emergency savings fund."
    return jsonify({"title": "AI Financial Insight", "text": text})

@app.route("/health")
def health():
    return jsonify({"status": "Personal Finance Advisor Bot is running"})

init_db()

if __name__ == "__main__":
    app.run(debug=True)
