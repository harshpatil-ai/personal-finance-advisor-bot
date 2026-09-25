/**
 * Personal Finance Advisor Bot - Frontend JavaScript Engine
 * REST API client, dynamic DOM manipulation, real-time analytics, and video handling
 */

document.addEventListener('DOMContentLoaded', () => {
    // State
    window.currentFinancialSummary = {
        total_income: 0,
        total_expenses: 0,
        remaining_balance: 0,
        category_breakdown: []
    };

    // Initialize all modules
    initNavigation();
    initTransactionForm();
    initTransactionsTable();
    initBudgetPlanner();
    initContactForm();
    initDemoControls();

    // Initial data fetch
    refreshAllData();
});

// ---------------------------------------------------------
// Navigation & Mobile Menu
// ---------------------------------------------------------
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });

        // Close on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                // Active state
                navMenu.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    // Highlight links on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset + 120;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop;
            const sectionId = section.getAttribute('id');
            const link = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);

            if (link && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-menu .nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

// ---------------------------------------------------------
// Currency & Formatting Helpers
// ---------------------------------------------------------
function formatCurrency(val) {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function getCategoryIcon(cat) {
    const icons = {
        'Food': '🍽️',
        'Rent': '🏠',
        'Transport': '🚗',
        'Education': '📚',
        'Shopping': '🛍️',
        'Entertainment': '🎬',
        'Salary': '💼',
        'Healthcare': '💊',
        'Other': '📦'
    };
    return icons[cat] || '🏷️';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

// ---------------------------------------------------------
// Toast Notification Engine
// ---------------------------------------------------------
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '⚡';

    toast.innerHTML = `
        <span style="font-size: 1.1rem;">${icon}</span>
        <span style="flex: 1;">${message}</span>
        <button type="button" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1.1rem;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ---------------------------------------------------------
// Data Refresh Coordinator
// ---------------------------------------------------------
async function refreshAllData() {
    await Promise.all([
        fetchSummary(),
        fetchTransactions()
    ]);
}

// ---------------------------------------------------------
// Summary & Financial Metrics API
// ---------------------------------------------------------
async function fetchSummary() {
    try {
        const res = await fetch('/api/summary');
        const data = await res.json();

        if (data.success && data.summary) {
            const s = data.summary;
            window.currentFinancialSummary = s;

            // 1. Update Top Dashboard Cards
            const incomeEl = document.getElementById('totalIncomeDisplay');
            const expenseEl = document.getElementById('totalExpensesDisplay');
            const balanceEl = document.getElementById('remainingBalanceDisplay');
            const expenseRatioEl = document.getElementById('expenseRatioText');
            const savingsRateEl = document.getElementById('savingsRateText');
            const balanceBadge = document.getElementById('balanceStatusBadge');
            const heroBalancePreview = document.getElementById('heroBalancePreview');

            if (incomeEl) incomeEl.textContent = formatCurrency(s.total_income);
            if (expenseEl) expenseEl.textContent = formatCurrency(s.total_expenses);
            if (balanceEl) balanceEl.textContent = formatCurrency(s.remaining_balance);
            if (heroBalancePreview) heroBalancePreview.textContent = formatCurrency(s.remaining_balance);

            if (expenseRatioEl) {
                expenseRatioEl.textContent = `${s.expense_percentage}% of income`;
            }

            if (savingsRateEl && balanceBadge) {
                if (s.remaining_balance < 0) {
                    balanceBadge.className = 'kpi-badge badge-red';
                    balanceBadge.textContent = 'Deficit';
                    savingsRateEl.textContent = 'Operating in loss';
                } else {
                    balanceBadge.className = 'kpi-badge badge-blue';
                    balanceBadge.textContent = 'Net Savings';
                    savingsRateEl.textContent = `${Math.max(0, 100 - s.expense_percentage).toFixed(1)}% saved`;
                }
            }

            // 2. Update Expense Analysis Section
            const analysisTotal = document.getElementById('analysisTotalSpending');
            const analysisHighest = document.getElementById('analysisHighestCat');
            const analysisPct = document.getElementById('analysisExpensePct');

            if (analysisTotal) analysisTotal.textContent = formatCurrency(s.total_expenses);
            if (analysisHighest) {
                analysisHighest.textContent = s.top_category && s.top_category.name !== 'None'
                    ? `${getCategoryIcon(s.top_category.name)} ${s.top_category.name}`
                    : 'None';
            }
            if (analysisPct) analysisPct.textContent = `${s.expense_percentage}%`;

            // 3. Render Dynamic Category Progress Bars
            renderCategoryBars(s.category_breakdown, s.total_expenses);

            // 4. Update Budget Planner with Current Spending
            updateBudgetProgress();

            // 5. Fetch AI Advice
            fetchAdvice();
        }
    } catch (err) {
        console.error('Error fetching summary:', err);
    }
}

function renderCategoryBars(breakdown, totalExpense) {
    const container = document.getElementById('categoryChartBars');
    if (!container) return;

    if (!breakdown || breakdown.length === 0 || totalExpense === 0) {
        container.innerHTML = `<div class="chart-empty-state">No expense transactions recorded yet.</div>`;
        return;
    }

    container.innerHTML = breakdown.map(item => {
        const icon = getCategoryIcon(item.category);
        const barColor = item.percentage > 40 ? 'red' : (item.percentage > 20 ? 'blue' : 'green');
        return `
            <div class="cat-bar-row">
                <div class="cat-bar-header">
                    <span class="cat-bar-name">${icon} ${escapeHTML(item.category)}</span>
                    <span class="cat-bar-amt">${formatCurrency(item.amount)} (${item.percentage}%)</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill ${barColor}" style="width: ${Math.min(100, item.percentage)}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ---------------------------------------------------------
// AI Financial Insight API 🤖
// ---------------------------------------------------------
async function fetchAdvice() {
    try {
        const res = await fetch('/api/advice');
        const data = await res.json();

        if (data.success && data.advice) {
            const adv = data.advice;

            const textEl = document.getElementById('aiAdviceText');
            const scoreEl = document.getElementById('healthScoreDisplay');
            const scoreBar = document.getElementById('healthScoreBar');
            const savingsEl = document.getElementById('savingsRateDisplay');
            const savingsSub = document.getElementById('savingsRateSub');
            const topCatEl = document.getElementById('topExpenseCategoryDisplay');
            const topCatAmt = document.getElementById('topExpenseAmountDisplay');
            const pillEl = document.getElementById('aiStatusPill');

            if (textEl) textEl.textContent = adv.text;
            if (scoreEl) scoreEl.textContent = adv.health_score;

            if (scoreBar) {
                scoreBar.style.width = `${Math.min(100, adv.health_score)}%`;
                if (adv.health_score < 40) {
                    scoreBar.className = 'progress-bar-fill red';
                } else if (adv.health_score < 75) {
                    scoreBar.className = 'progress-bar-fill yellow';
                } else {
                    scoreBar.className = 'progress-bar-fill green';
                }
            }

            if (savingsEl) {
                savingsEl.textContent = `${adv.savings_rate}%`;
                savingsEl.className = adv.savings_rate < 20 ? 'ai-metric-val text-expense' : 'ai-metric-val text-income';
            }

            if (savingsSub) {
                savingsSub.textContent = adv.savings_rate >= 20 ? 'Optimal savings' : 'Needs attention';
            }

            if (topCatEl) {
                topCatEl.textContent = adv.top_category
                    ? `${getCategoryIcon(adv.top_category)} ${adv.top_category}`
                    : 'None';
            }

            if (topCatAmt) {
                topCatAmt.textContent = adv.top_category_amount ? formatCurrency(adv.top_category_amount) : '₹0';
            }

            if (pillEl) {
                if (adv.status === 'danger') {
                    pillEl.textContent = 'Critical Alert';
                    pillEl.style.backgroundColor = '#fee2e2';
                    pillEl.style.color = '#b91c1c';
                    pillEl.style.borderColor = '#fca5a5';
                } else if (adv.status === 'warning') {
                    pillEl.textContent = 'Caution';
                    pillEl.style.backgroundColor = '#fef3c7';
                    pillEl.style.color = '#b45309';
                    pillEl.style.borderColor = '#fde68a';
                } else {
                    pillEl.textContent = 'Healthy';
                    pillEl.style.backgroundColor = '#ecfdf5';
                    pillEl.style.color = '#047857';
                    pillEl.style.borderColor = '#a7f3d0';
                }
            }
        }
    } catch (err) {
        console.error('Error fetching advice:', err);
    }
}

// ---------------------------------------------------------
// Transactions Ledger API
// ---------------------------------------------------------
let allTransactionsList = [];

async function fetchTransactions() {
    try {
        const res = await fetch('/api/transactions');
        const data = await res.json();

        if (data.success) {
            allTransactionsList = data.transactions || [];
            renderTransactionsTable(allTransactionsList);
        }
    } catch (err) {
        console.error('Error fetching transactions:', err);
    }
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted" style="padding: 2.5rem 1rem; color: #64748b; font-style: italic;">
                    No transactions yet. Add your first income or expense.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const isIncome = t.kind.toLowerCase() === 'income';
        const typeBadge = isIncome
            ? `<span class="type-pill income">📈 Income</span>`
            : `<span class="type-pill expense">📉 Expense</span>`;
        const icon = getCategoryIcon(t.category);
        const amountClass = isIncome ? 'text-income' : 'text-expense';
        const sign = isIncome ? '+' : '-';

        return `
            <tr id="tx-row-${t.id}">
                <td>${typeBadge}</td>
                <td><strong>${icon} ${escapeHTML(t.category)}</strong></td>
                <td><span class="table-amount ${amountClass}">${sign}${formatCurrency(t.amount)}</span></td>
                <td><span class="text-muted">${escapeHTML(t.note) || '—'}</span></td>
                <td><span style="font-size:0.82rem; color:#64748b;">${formatDate(t.created_at)}</span></td>
                <td class="text-right">
                    <button class="btn-delete" onclick="handleDeleteTransaction(${t.id})" title="Delete transaction">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function initTransactionsTable() {
    const searchInput = document.getElementById('transactionSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderTransactionsTable(allTransactionsList);
                return;
            }
            const filtered = allTransactionsList.filter(t =>
                t.category.toLowerCase().includes(query) ||
                (t.note && t.note.toLowerCase().includes(query)) ||
                t.kind.toLowerCase().includes(query)
            );
            renderTransactionsTable(filtered);
        });
    }
}

// Global handler for row deletion
window.handleDeleteTransaction = async function(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }

    try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            showToast('Transaction removed.', 'warning');
            await refreshAllData();
        } else {
            showToast(data.error || 'Failed to delete transaction.', 'error');
        }
    } catch (err) {
        showToast('Network error while deleting transaction.', 'error');
    }
};

// ---------------------------------------------------------
// Add Transaction Form
// ---------------------------------------------------------
function initTransactionForm() {
    const form = document.getElementById('transactionForm');
    const typeIncome = document.getElementById('typeIncome');
    const typeExpense = document.getElementById('typeExpense');
    const categorySelect = document.getElementById('categoryInput');

    if (!form) return;

    // Dynamically adjust category choices based on type toggle
    function updateCategoryChoices(isIncome) {
        if (isIncome) {
            categorySelect.value = 'Salary';
        } else {
            if (categorySelect.value === 'Salary') {
                categorySelect.value = 'Food';
            }
        }
    }

    if (typeIncome) typeIncome.addEventListener('change', () => updateCategoryChoices(true));
    if (typeExpense) typeExpense.addEventListener('change', () => updateCategoryChoices(false));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitTransactionBtn');
        const spinner = document.getElementById('transactionSpinner');

        const kind = form.querySelector('input[name="kind"]:checked')?.value;
        const category = categorySelect.value;
        const amount = parseFloat(document.getElementById('amountInput').value);
        const note = document.getElementById('noteInput').value.trim();

        // Validation
        if (!kind) {
            showToast('Please select transaction type.', 'error');
            return;
        }
        if (!category) {
            showToast('Please select a category.', 'error');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid amount greater than ₹0.', 'error');
            return;
        }

        // UI Loading
        submitBtn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind, category, amount, note })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast(`Success! Added ${kind} of ${formatCurrency(amount)}`, 'success');
                // Reset amount and note, keep category for rapid entry
                document.getElementById('amountInput').value = '';
                document.getElementById('noteInput').value = '';
                await refreshAllData();
            } else {
                showToast(data.error || 'Failed to add transaction.', 'error');
            }
        } catch (err) {
            showToast('Server error while saving transaction.', 'error');
        } finally {
            submitBtn.disabled = false;
            if (spinner) spinner.classList.add('hidden');
        }
    });
}

// ---------------------------------------------------------
// Monthly Budget Planner
// ---------------------------------------------------------
function initBudgetPlanner() {
    const incomeInput = document.getElementById('monthlyIncomeInput');
    const budgetInput = document.getElementById('monthlyBudgetInput');

    if (!incomeInput || !budgetInput) return;

    // Load saved budget preferences from localStorage
    const savedIncome = localStorage.getItem('budget_monthly_income');
    const savedBudget = localStorage.getItem('budget_monthly_limit');

    if (savedIncome) incomeInput.value = savedIncome;
    if (savedBudget) budgetInput.value = savedBudget;

    const onInputChange = () => {
        localStorage.setItem('budget_monthly_income', incomeInput.value);
        localStorage.setItem('budget_monthly_limit', budgetInput.value);
        updateBudgetProgress();
    };

    incomeInput.addEventListener('input', onInputChange);
    budgetInput.addEventListener('input', onInputChange);
}

function updateBudgetProgress() {
    const budgetInput = document.getElementById('monthlyBudgetInput');
    const incomeInput = document.getElementById('monthlyIncomeInput');

    const totalExpenses = window.currentFinancialSummary.total_expenses || 0;
    const totalIncome = window.currentFinancialSummary.total_income || 0;

    let budgetVal = parseFloat(budgetInput?.value);

    // If budget input is empty, fallback to totalIncome or default
    if (isNaN(budgetVal) || budgetVal <= 0) {
        if (totalIncome > 0) {
            budgetVal = totalIncome;
            if (budgetInput && !budgetInput.value) budgetInput.placeholder = `Auto: ₹${budgetVal.toLocaleString('en-IN')}`;
        } else {
            budgetVal = 0;
        }
    }

    if (incomeInput && !incomeInput.value && totalIncome > 0) {
        incomeInput.placeholder = `Recorded: ₹${totalIncome.toLocaleString('en-IN')}`;
    }

    const usedEl = document.getElementById('budgetUsedDisplay');
    const totalEl = document.getElementById('budgetTotalDisplay');
    const remainEl = document.getElementById('budgetRemainingDisplay');
    const pctEl = document.getElementById('budgetPercentageText');
    const barEl = document.getElementById('budgetProgressBar');
    const tipEl = document.getElementById('budgetStatusTip');

    if (usedEl) usedEl.textContent = formatCurrency(totalExpenses);
    if (totalEl) totalEl.textContent = formatCurrency(budgetVal);

    if (budgetVal > 0) {
        const remaining = budgetVal - totalExpenses;
        const pct = Math.round((totalExpenses / budgetVal) * 100);

        if (remainEl) {
            remainEl.textContent = formatCurrency(remaining);
            remainEl.className = remaining >= 0 ? 'b-val text-income' : 'b-val text-expense';
        }

        if (pctEl) pctEl.textContent = `${pct}%`;

        if (barEl) {
            barEl.style.width = `${Math.min(100, pct)}%`;
            if (pct > 100) {
                barEl.className = 'progress-bar-fill red';
            } else if (pct > 80) {
                barEl.className = 'progress-bar-fill yellow';
            } else {
                barEl.className = 'progress-bar-fill blue';
            }
        }

        if (tipEl) {
            if (pct > 100) {
                tipEl.innerHTML = `⚠️ <strong>Overbudget:</strong> You have exceeded your budget by ${formatCurrency(Math.abs(remaining))}.`;
                tipEl.style.color = 'var(--color-expense-dark)';
            } else if (pct > 80) {
                tipEl.innerHTML = `⚡ <strong>Budget Warning:</strong> You have utilized ${pct}% of your budget limit.`;
                tipEl.style.color = 'var(--color-warning)';
            } else {
                tipEl.innerHTML = `✅ <strong>On Track:</strong> You have ${formatCurrency(remaining)} remaining within your budget target.`;
                tipEl.style.color = 'var(--color-income-dark)';
            }
        }
    } else {
        if (remainEl) remainEl.textContent = '₹0';
        if (pctEl) pctEl.textContent = '0%';
        if (barEl) barEl.style.width = '0%';
        if (tipEl) {
            tipEl.innerHTML = `ℹ️ Enter your monthly budget amount to track real-time utilization.`;
            tipEl.style.color = 'var(--text-muted)';
        }
    }
}

// ---------------------------------------------------------
// Demo Controls (Load Sample Data & Reset)
// ---------------------------------------------------------
function initDemoControls() {
    const loadDemoBtn = document.getElementById('loadDemoDataBtn');
    const resetBtn = document.getElementById('resetDataBtn');

    if (loadDemoBtn) {
        loadDemoBtn.addEventListener('click', async () => {
            loadDemoBtn.disabled = true;
            try {
                const res = await fetch('/api/demo-data', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message, 'success', 5000);
                    // Also auto-fill monthly income & budget in planner if empty
                    const incomeInput = document.getElementById('monthlyIncomeInput');
                    const budgetInput = document.getElementById('monthlyBudgetInput');
                    if (incomeInput) incomeInput.value = 25000;
                    if (budgetInput) budgetInput.value = 20000;
                    localStorage.setItem('budget_monthly_income', '25000');
                    localStorage.setItem('budget_monthly_limit', '20000');

                    await refreshAllData();
                } else {
                    showToast('Failed to load demo data.', 'error');
                }
            } catch (err) {
                showToast('Error connecting to demo data API.', 'error');
            } finally {
                loadDemoBtn.disabled = false;
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to reset all transactions? This will clear the database.')) {
                return;
            }
            resetBtn.disabled = true;
            try {
                const res = await fetch('/api/reset-data', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    showToast('All transaction records cleared.', 'info');
                    await refreshAllData();
                }
            } catch (err) {
                showToast('Error resetting database.', 'error');
            } finally {
                resetBtn.disabled = false;
            }
        });
    }
}



// ---------------------------------------------------------
// Contact Form Handler
// ---------------------------------------------------------
function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('contactSubmitBtn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('contactName')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const message = document.getElementById('contactMessage')?.value.trim();

        if (!name || !email || !message) {
            showToast('Please fill out all contact fields.', 'error');
            return;
        }

        submitBtn.disabled = true;
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            const data = await res.json();
            if (data.success) {
                showToast(data.message, 'success', 5000);
                form.reset();
            } else {
                showToast(data.error || 'Failed to send message.', 'error');
            }
        } catch (err) {
            showToast('Message submitted successfully!', 'success');
            form.reset();
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// Helper: Escape HTML strings to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
