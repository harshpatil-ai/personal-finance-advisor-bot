import os
import unittest
import json
from app import app, get_db_connection, init_db

class PersonalFinanceAdvisorBotTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'test_finance.db')
        self.client = app.test_client()
        init_db()

    def tearDown(self):
        with get_db_connection() as conn:
            conn.execute("DELETE FROM transactions")
            conn.commit()

    def test_health_check(self):
        """Test /health endpoint returns healthy status"""
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['app'], 'Personal Finance Advisor Bot')

    def test_index_route(self):
        """Test GET / returns complete main HTML page with all core UI anchors"""
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Personal Finance Advisor Bot', res.data)
        self.assertIn(b'Open Dashboard', res.data)
        self.assertIn(b'Key Features', res.data)
        self.assertIn(b'Total Income', res.data)
        self.assertIn(b'Remaining Balance', res.data)
        self.assertIn(b'AI Financial Insight', res.data)

    def test_add_and_get_transaction(self):
        """Test adding income and expense, and getting newest first"""
        # Add income
        res1 = self.client.post('/api/transactions', json={
            'kind': 'income',
            'category': 'Salary',
            'amount': 30000.0,
            'note': 'Software Engineering Internship'
        })
        self.assertEqual(res1.status_code, 201)
        data1 = res1.get_json()
        self.assertTrue(data1['success'])
        self.assertEqual(data1['transaction']['amount'], 30000.0)

        # Add expense
        res2 = self.client.post('/api/transactions', json={
            'kind': 'expense',
            'category': 'Food',
            'amount': 5000.0,
            'note': 'Hostel mess & groceries'
        })
        self.assertEqual(res2.status_code, 201)

        # Fetch transactions list
        get_res = self.client.get('/api/transactions')
        self.assertEqual(get_res.status_code, 200)
        tx_list = get_res.get_json()['transactions']
        self.assertEqual(len(tx_list), 2)
        # Newest first
        self.assertEqual(tx_list[0]['kind'], 'expense')
        self.assertEqual(tx_list[1]['kind'], 'income')

    def test_delete_transaction(self):
        """Test deleting a transaction and handling not-found errors"""
        add_res = self.client.post('/api/transactions', json={
            'kind': 'expense',
            'category': 'Transport',
            'amount': 250.0,
            'note': 'Metro card recharge'
        })
        tx_id = add_res.get_json()['transaction']['id']

        # Delete transaction
        del_res = self.client.delete(f'/api/transactions/{tx_id}')
        self.assertEqual(del_res.status_code, 200)
        self.assertTrue(del_res.get_json()['success'])

        # Verify deletion
        txs = self.client.get('/api/transactions').get_json()['transactions']
        self.assertEqual(len(txs), 0)

        # 404 for non-existent ID
        del_404 = self.client.delete('/api/transactions/99999')
        self.assertEqual(del_404.status_code, 404)

    def test_validation_errors(self):
        """Test invalid payloads receive 400 Bad Request"""
        # Negative amount
        res = self.client.post('/api/transactions', json={
            'kind': 'income',
            'category': 'Salary',
            'amount': -500
        })
        self.assertEqual(res.status_code, 400)

        # Zero amount
        res_zero = self.client.post('/api/transactions', json={
            'kind': 'income',
            'category': 'Salary',
            'amount': 0
        })
        self.assertEqual(res_zero.status_code, 400)

        # Invalid kind
        res_kind = self.client.post('/api/transactions', json={
            'kind': 'crypto',
            'category': 'Salary',
            'amount': 500
        })
        self.assertEqual(res_kind.status_code, 400)

        # Empty category
        res_cat = self.client.post('/api/transactions', json={
            'kind': 'expense',
            'category': '',
            'amount': 500
        })
        self.assertEqual(res_cat.status_code, 400)

    def test_summary_and_advice_calculations(self):
        """Test balance calculations and AI advice tiers"""
        # 1. Low spending (<50%)
        self.client.post('/api/transactions', json={'kind': 'income', 'category': 'Salary', 'amount': 25000})
        self.client.post('/api/transactions', json={'kind': 'expense', 'category': 'Food', 'amount': 5000})

        res = self.client.get('/api/summary')
        self.assertEqual(res.status_code, 200)
        s = res.get_json()['summary']
        self.assertEqual(s['total_income'], 25000.0)
        self.assertEqual(s['total_expenses'], 5000.0)
        self.assertEqual(s['remaining_balance'], 20000.0)
        self.assertEqual(s['expense_percentage'], 20.0)
        self.assertEqual(s['top_category']['name'], 'Food')

        adv_res = self.client.get('/api/advice')
        adv = adv_res.get_json()['advice']
        self.assertIn('Good spending control', adv['text'])
        self.assertEqual(adv['status'], 'success')
        self.assertGreaterEqual(adv['health_score'], 80)

        # 2. Moderate spending (50% to 80%)
        self.client.post('/api/transactions', json={'kind': 'expense', 'category': 'Rent', 'amount': 10000}) # total 15,000 = 60%
        adv_res2 = self.client.get('/api/advice')
        adv2 = adv_res2.get_json()['advice']
        self.assertIn('Your spending is moderate', adv2['text'])
        self.assertEqual(adv2['status'], 'moderate')

        # 3. High spending (>80%)
        self.client.post('/api/transactions', json={'kind': 'expense', 'category': 'Shopping', 'amount': 6000}) # total 21,000 = 84%
        adv_res3 = self.client.get('/api/advice')
        adv3 = adv_res3.get_json()['advice']
        self.assertIn('above 80% of your income', adv3['text'])
        self.assertEqual(adv3['status'], 'warning')

        # 4. Deficit (expenses > income)
        self.client.post('/api/transactions', json={'kind': 'expense', 'category': 'Healthcare', 'amount': 6000}) # total 27,000 > 25,000
        adv_res4 = self.client.get('/api/advice')
        adv4 = adv_res4.get_json()['advice']
        self.assertIn('Critical Alert', adv4['text'])
        self.assertEqual(adv4['status'], 'danger')

    def test_demo_data_loader(self):
        """Test POST /api/demo-data populates exact sample dataset"""
        res = self.client.post('/api/demo-data')
        self.assertEqual(res.status_code, 200)

        sum_res = self.client.get('/api/summary')
        s = sum_res.get_json()['summary']
        self.assertEqual(s['total_income'], 25000.0)
        self.assertEqual(s['total_expenses'], 10300.0)
        self.assertEqual(s['remaining_balance'], 14700.0)
        self.assertEqual(len(s['category_breakdown']), 4)

    def test_reset_data(self):
        """Test POST /api/reset-data clears all transactions"""
        self.client.post('/api/demo-data')
        reset_res = self.client.post('/api/reset-data')
        self.assertEqual(reset_res.status_code, 200)
        self.assertTrue(reset_res.get_json()['success'])

        sum_res = self.client.get('/api/summary')
        s = sum_res.get_json()['summary']
        self.assertEqual(s['total_income'], 0.0)
        self.assertEqual(s['total_expenses'], 0.0)
        self.assertEqual(s['remaining_balance'], 0.0)
        self.assertEqual(s['transaction_count'], 0)

    def test_contact_form(self):
        """Test POST /api/contact receives messages and validates inputs"""
        # Valid submission
        valid_res = self.client.post('/api/contact', json={
            'name': 'Rahul Sharma',
            'email': 'rahul@example.com',
            'message': 'Great project for college viva!'
        })
        self.assertEqual(valid_res.status_code, 200)
        self.assertTrue(valid_res.get_json()['success'])

        # Missing message
        invalid_res = self.client.post('/api/contact', json={
            'name': 'Rahul Sharma',
            'email': 'rahul@example.com',
            'message': ''
        })
        self.assertEqual(invalid_res.status_code, 400)

if __name__ == '__main__':
    unittest.main()
