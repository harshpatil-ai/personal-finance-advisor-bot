import os
import sqlite3
from datetime import datetime, timezone
from contextlib import contextmanager
from flask import Flask, request, jsonify, render_template

# ---------------------------------------------------------
# App Initialization & Configuration
# ---------------------------------------------------------
app = Flask(__name__)

# Base directories
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE = os.path.join(BASE_DIR, 'finance.db')


# ---------------------------------------------------------
# Database Utilities
# ---------------------------------------------------------
@contextmanager
def get_db_connection():
    """Create and yield a thread-safe connection to SQLite, ensuring closure on exit."""
    db_path = app.config.get('DATABASE', DATABASE)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialize SQLite database schema if tables do not exist."""
    with get_db_connection() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL CHECK(kind IN ('income', 'expense')),
                category TEXT NOT NULL,
                amount REAL NOT NULL CHECK(amount > 0),
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        conn.commit()


# Initialize database on module load
init_db()


# ---------------------------------------------------------
# Web Page Route
# ---------------------------------------------------------
@app.route('/')
def index():
    """Render the main frontend dashboard single page."""
    return render_template('index.html')


# ---------------------------------------------------------
# REST API: Transactions Management
# ---------------------------------------------------------
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Retrieve all transactions ordered newest first."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, kind, category, amount, note, created_at
                FROM transactions
                ORDER BY created_at DESC, id DESC
            ''')
            rows = cursor.fetchall()
            transactions = [
                {
                    'id': row['id'],
                    'kind': row['kind'],
                    'category': row['category'],
                    'amount': float(row['amount']),
                    'note': row['note'] or '',
                    'created_at': row['created_at']
                }
                for row in rows
            ]
        return jsonify({'success': True, 'transactions': transactions}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction (Income or Expense)."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON body.'}), 400

    kind = data.get('kind', '').strip().lower()
    category = data.get('category', '').strip()
    amount_raw = data.get('amount')
    note = data.get('note', '').strip()

    # Validation
    if kind not in ['income', 'expense']:
        return jsonify({'success': False, 'error': 'Transaction type must be "income" or "expense".'}), 400

    valid_categories = [
        'Food', 'Rent', 'Transport', 'Education', 'Shopping',
        'Entertainment', 'Salary', 'Healthcare', 'Other'
    ]
    if not category:
        return jsonify({'success': False, 'error': 'Category is required.'}), 400

    # Match category case-insensitively or assign properly
    matched_cat = next((c for c in valid_categories if c.lower() == category.lower()), None)
    if not matched_cat:
        category = category.title()
    else:
        category = matched_cat

    try:
        amount = float(amount_raw)
        if amount <= 0:
            return jsonify({'success': False, 'error': 'Amount must be greater than zero.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Amount must be a valid positive number.'}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO transactions (kind, category, amount, note)
                VALUES (?, ?, ?, ?)
            ''', (kind, category, amount, note))
            new_id = cursor.lastrowid
            conn.commit()

            cursor.execute('SELECT id, kind, category, amount, note, created_at FROM transactions WHERE id = ?', (new_id,))
            new_row = cursor.fetchone()

        return jsonify({
            'success': True,
            'message': 'Transaction added successfully.',
            'transaction': {
                'id': new_row['id'],
                'kind': new_row['kind'],
                'category': new_row['category'],
                'amount': float(new_row['amount']),
                'note': new_row['note'] or '',
                'created_at': new_row['created_at']
            }
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a single transaction by ID."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM transactions WHERE id = ?', (transaction_id,))
            if not cursor.fetchone():
                return jsonify({'success': False, 'error': 'Transaction not found.'}), 404

            cursor.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
            conn.commit()

        return jsonify({'success': True, 'message': 'Transaction deleted successfully.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ---------------------------------------------------------
# REST API: Summary & AI Insights
# ---------------------------------------------------------
@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Calculate summary figures: income, expenses, remaining balance, and categories."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Total Income
            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE kind = 'income'")
            total_income = float(cursor.fetchone()[0])

            # Total Expenses
            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE kind = 'expense'")
            total_expenses = float(cursor.fetchone()[0])

            # Expense category breakdown
            cursor.execute('''
                SELECT category, SUM(amount) as cat_total
                FROM transactions
                WHERE kind = 'expense'
                GROUP BY category
                ORDER BY cat_total DESC
            ''')
            expense_rows = cursor.fetchall()

            # Transaction count
            cursor.execute('SELECT COUNT(*) FROM transactions')
            transaction_count = cursor.fetchone()[0]

        remaining_balance = total_income - total_expenses
        expense_percentage = round((total_expenses / total_income * 100), 1) if total_income > 0 else 0.0

        category_breakdown = []
        top_category = {'name': 'None', 'amount': 0.0, 'percentage': 0.0}

        for idx, row in enumerate(expense_rows):
            cat_name = row['category']
            cat_amount = float(row['cat_total'])
            cat_pct = round((cat_amount / total_expenses * 100), 1) if total_expenses > 0 else 0.0
            breakdown_item = {
                'category': cat_name,
                'amount': cat_amount,
                'percentage': cat_pct
            }
            category_breakdown.append(breakdown_item)
            if idx == 0:
                top_category = {
                    'name': cat_name,
                    'amount': cat_amount,
                    'percentage': cat_pct
                }

        return jsonify({
            'success': True,
            'summary': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'remaining_balance': remaining_balance,
                'expense_percentage': expense_percentage,
                'top_category': top_category,
                'category_breakdown': category_breakdown,
                'transaction_count': transaction_count
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/advice', methods=['GET'])
def get_advice():
    """Generate intelligent financial insights and recommendations based on user data."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE kind = 'income'")
            total_income = float(cursor.fetchone()[0])

            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE kind = 'expense'")
            total_expenses = float(cursor.fetchone()[0])

            cursor.execute('''
                SELECT category, SUM(amount) as cat_total
                FROM transactions
                WHERE kind = 'expense'
                GROUP BY category
                ORDER BY cat_total DESC
                LIMIT 1
            ''')
            top_row = cursor.fetchone()

        remaining_balance = total_income - total_expenses
        top_category_name = top_row['category'] if top_row else None
        top_category_amount = float(top_row['cat_total']) if top_row else 0.0

        # AI Advice Engine Logic
        if total_income == 0 and total_expenses == 0:
            advice_text = "Welcome to Personal Finance Advisor Bot! Start by adding your monthly income and recent expenses to generate personalized AI financial insights."
            status_level = "info"
            health_score = 50
            savings_rate = 0.0
            highlight = "No data yet. Ready for your first transaction."
        elif total_income == 0 and total_expenses > 0:
            advice_text = f"You have recorded expenses of ₹{total_expenses:,.2f} without registering any income. Please add your income source (like Salary or Allowance) to calculate your savings rate and financial health."
            status_level = "warning"
            health_score = 25
            savings_rate = 0.0
            highlight = "Income missing! Add income to complete analysis."
        elif total_expenses > total_income:
            deficit = total_expenses - total_income
            advice_text = f"Critical Alert: Your expenses (₹{total_expenses:,.2f}) exceed your total income (₹{total_income:,.2f}) by ₹{deficit:,.2f}. You are operating at a deficit. Immediately pause discretionary expenses and review {top_category_name or 'your spending'}."
            status_level = "danger"
            health_score = 20
            savings_rate = 0.0
            highlight = f"Operating at a deficit of ₹{deficit:,.2f}."
        else:
            expense_ratio = (total_expenses / total_income) * 100
            savings_rate = round(100 - expense_ratio, 1)

            if expense_ratio > 80:
                advice_text = "Your expenses are above 80% of your income. Review non-essential spending and try to keep some money aside for savings."
                status_level = "warning"
                health_score = 45
                highlight = f"High spending ratio ({expense_ratio:.1f}%). Largest expense: {top_category_name} (₹{top_category_amount:,.2f})."
            elif 50 <= expense_ratio <= 80:
                advice_text = "Your spending is moderate. Review your largest expense category and consider saving 10–20% of your income."
                status_level = "moderate"
                health_score = 75
                highlight = f"Moderate spending ratio ({expense_ratio:.1f}%). Solid baseline with room for consistent savings."
            else:
                # Less than 50%
                advice_text = "Good spending control. Keep essential expenses stable and consider building an emergency savings fund."
                status_level = "success"
                health_score = 92
                highlight = f"Excellent savings potential! You retain {savings_rate:.1f}% of your monthly income."

        return jsonify({
            'success': True,
            'advice': {
                'text': advice_text,
                'status': status_level,
                'health_score': health_score,
                'savings_rate': savings_rate,
                'highlight': highlight,
                'top_category': top_category_name,
                'top_category_amount': top_category_amount,
                'recommended_savings': round(total_income * 0.20, 2) if total_income > 0 else 0.0
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ---------------------------------------------------------
# REST API: Demo Data & Reset
# ---------------------------------------------------------
@app.route('/api/demo-data', methods=['POST'])
def load_demo_data():
    """Populate database with sample college student financial records."""
    sample_records = [
        ('income', 'Salary', 25000.0, 'Monthly Internship Stipend / Salary'),
        ('expense', 'Food', 4500.0, 'Hostel Mess & Groceries'),
        ('expense', 'Transport', 1800.0, 'Metro Card Recharge & Fuel'),
        ('expense', 'Education', 2500.0, 'Technical Certification & Textbooks'),
        ('expense', 'Shopping', 1500.0, 'Stationery & Project Hardware')
    ]

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM transactions')  # Clean existing for clean demo state
            cursor.executemany('''
                INSERT INTO transactions (kind, category, amount, note)
                VALUES (?, ?, ?, ?)
            ''', sample_records)
            conn.commit()

        return jsonify({
            'success': True,
            'message': 'Demo data loaded successfully with ₹25,000 income and realistic student expenses!'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/reset-data', methods=['POST'])
def reset_data():
    """Clear all transactions from the database."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM transactions')
            conn.commit()
        return jsonify({'success': True, 'message': 'All financial data has been cleared.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ---------------------------------------------------------
# Contact & Health Endpoints
# ---------------------------------------------------------
@app.route('/api/contact', methods=['POST'])
def handle_contact():
    """Accept project inquiries and contact form submissions."""
    data = request.get_json(silent=True) or request.form
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    message = (data.get('message') or '').strip()

    if not name or not email or not message:
        return jsonify({'success': False, 'error': 'Please provide your name, email, and message.'}), 400

    return jsonify({
        'success': True,
        'message': f"Thank you, {name}! Your message has been received. We will get back to you shortly."
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        'status': 'healthy',
        'app': 'Personal Finance Advisor Bot',
        'version': '1.0.0',
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200


# ---------------------------------------------------------
# Error Handlers
# ---------------------------------------------------------
@app.errorhandler(404)
def handle_not_found(error):
    """Fallback 404 handler."""
    return jsonify({'success': False, 'error': 'Resource not found.'}), 404


# ---------------------------------------------------------
# Main Execution Entrypoint
# ---------------------------------------------------------
if __name__ == '__main__':
    print("=" * 60)
    print(" Personal Finance Advisor Bot 💰")
    print(" Smart Budgeting & AI-Driven Savings Insights")
    print(" Running at: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host='127.0.0.1', port=5000, debug=True)
