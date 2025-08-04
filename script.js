class ExpenseTrackerPro {
    constructor() {
        this.transactions = [];
        this.currentTransactionId = null;
        this.currentPage = 1;
        this.transactionsPerPage = 10;
        this.charts = {};
        this.theme = 'light';
        
        this.init();
    }

    init() {
        this.initializeTheme();
        this.initializeEventListeners();
        this.setDefaultDates();
        this.updateAllDisplays();
        this.initializeCharts();
        this.showWelcomeMessage();
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle?.querySelector('i');
        if (icon) {
            icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    initializeEventListeners() {
        // Form submissions
        document.getElementById('incomeForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit('income');
        });

        document.getElementById('expenseForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit('expense');
        });

        // Edit form submission
        document.getElementById('editForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionUpdate();
        });

        // Navigation buttons
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('importFile')?.click();
        });

        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.importData(e);
        });

        // Quick actions
        document.getElementById('clearAllBtn')?.addEventListener('click', () => {
            this.clearAllData();
        });

        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateReport();
        });

        // Search and filters
        document.getElementById('searchTransactions')?.addEventListener('input', (e) => {
            this.filterTransactions();
        });

        ['filterType', 'filterCategory', 'filterPeriod'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.filterTransactions();
                });
            }
        });

        // Chart controls
        const chartPeriod = document.getElementById('chartPeriod');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', () => {
                this.updateCharts();
            });
        }

        // Modal controls
        const closeModal = document.getElementById('closeModal');
        const cancelEdit = document.getElementById('cancelEdit');
        
        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        if (cancelEdit) cancelEdit.addEventListener('click', () => this.closeModal());

        // Close modal on background click
        const editModal = document.getElementById('editModal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target.id === 'editModal') {
                    this.closeModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const incomeDate = document.getElementById('incomeDate');
        const expenseDate = document.getElementById('expenseDate');
        
        if (incomeDate) incomeDate.value = today;
        if (expenseDate) expenseDate.value = today;
    }

    // Transaction Management
    handleTransactionSubmit(type) {
        try {
            this.showLoading(true);
            
            const formData = this.getFormData(type);
            
            if (!this.validateTransaction(formData)) {
                this.showLoading(false);
                return;
            }

            const transaction = {
                id: Date.now() + Math.random(),
                type,
                ...formData,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            this.transactions.push(transaction);
            this.updateAllDisplays();
            this.resetForm(type);
            
            this.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} of $${formData.amount.toFixed(2)} added successfully!`, 'success');
            this.showLoading(false);
            
        } catch (error) {
            this.showError('Failed to add transaction. Please try again.');
            this.showLoading(false);
        }
    }

    getFormData(type) {
        const dateEl = document.getElementById(`${type}Date`);
        const descEl = document.getElementById(`${type}Description`);
        const categoryEl = document.getElementById(`${type}Category`);
        const amountEl = document.getElementById(`${type}Amount`);
        const notesEl = document.getElementById(`${type}Notes`);
        
        return {
            date: dateEl ? dateEl.value : '',
            description: descEl ? descEl.value.trim() : '',
            category: categoryEl ? categoryEl.value : '',
            amount: amountEl ? parseFloat(amountEl.value) || 0 : 0,
            notes: notesEl ? notesEl.value.trim() : ''
        };
    }

    validateTransaction(data) {
        const { date, description, category, amount } = data;

        if (!date) {
            this.showError('Please select a date.');
            return false;
        }

        const selectedDate = new Date(date);
        const today = new Date();
        const futureLimit = new Date();
        futureLimit.setFullYear(today.getFullYear() + 1);

        if (selectedDate > futureLimit) {
            this.showError('Date cannot be more than 1 year in the future.');
            return false;
        }

        if (!description || description.length < 3) {
            this.showError('Description must be at least 3 characters long.');
            return false;
        }

        if (description.length > 100) {
            this.showError('Description cannot exceed 100 characters.');
            return false;
        }

        if (!category) {
            this.showError('Please select a category.');
            return false;
        }

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount greater than 0.');
            return false;
        }

        if (amount > 1000000) {
            this.showError('Amount cannot exceed $1,000,000.');
            return false;
        }

        return true;
    }

    resetForm(type) {
        const form = document.getElementById(`${type}Form`);
        if (form) {
            form.reset();
            this.setDefaultDates();
        }
    }

    deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        try {
            const deletedTransaction = this.transactions.find(t => t.id === id);
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.updateAllDisplays();
            
            if (deletedTransaction) {
                this.showToast(`${deletedTransaction.type.charAt(0).toUpperCase() + deletedTransaction.type.slice(1)} of $${deletedTransaction.amount.toFixed(2)} deleted successfully!`, 'success');
            }
        } catch (error) {
            this.showError('Failed to delete transaction. Please try again.');
        }
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) {
            this.showError('Transaction not found.');
            return;
        }

        this.currentTransactionId = id;
        this.populateEditForm(transaction);
        this.showModal();
    }

    populateEditForm(transaction) {
        const editDate = document.getElementById('editDate');
        const editDescription = document.getElementById('editDescription');
        const editAmount = document.getElementById('editAmount');
        const editNotes = document.getElementById('editNotes');
        const categorySelect = document.getElementById('editCategory');
        
        if (editDate) editDate.value = transaction.date;
        if (editDescription) editDescription.value = transaction.description;
        if (editAmount) editAmount.value = transaction.amount;
        if (editNotes) editNotes.value = transaction.notes || '';
        
        // Populate category options based on transaction type
        if (categorySelect) {
            categorySelect.innerHTML = '';
            
            const categories = transaction.type === 'income' 
                ? ['Salary', 'Freelance', 'Investment', 'Business', 'Rental', 'Bonus', 'Refund', 'Other']
                : ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Bills', 'Education', 'Travel', 'Insurance', 'Maintenance', 'Subscription', 'Other'];
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                if (cat === transaction.category) option.selected = true;
                categorySelect.appendChild(option);
            });
        }
    }

    handleTransactionUpdate() {
        try {
            const editDate = document.getElementById('editDate');
            const editDescription = document.getElementById('editDescription');
            const editCategory = document.getElementById('editCategory');
            const editAmount = document.getElementById('editAmount');
            const editNotes = document.getElementById('editNotes');
            
            const formData = {
                date: editDate ? editDate.value : '',
                description: editDescription ? editDescription.value.trim() : '',
                category: editCategory ? editCategory.value : '',
                amount: editAmount ? parseFloat(editAmount.value) || 0 : 0,
                notes: editNotes ? editNotes.value.trim() : ''
            };

            if (!this.validateTransaction(formData)) {
                return;
            }

            const transactionIndex = this.transactions.findIndex(t => t.id === this.currentTransactionId);
            if (transactionIndex === -1) {
                this.showError('Transaction not found.');
                return;
            }

            this.transactions[transactionIndex] = {
                ...this.transactions[transactionIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };

            this.updateAllDisplays();
            this.closeModal();
            this.showToast(`Transaction updated successfully!`, 'success');

        } catch (error) {
            this.showError('Failed to update transaction. Please try again.');
        }
    }

    // Display Updates
    updateAllDisplays() {
        this.updateSummaryCards();
        this.updateQuickStats();
        this.updateCategoryBreakdown();
        this.updateTransactionsTable();
        this.updateFilterOptions();
        this.updateCharts();
    }

    updateSummaryCards() {
        const stats = this.calculateStats();
        
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpensesEl = document.getElementById('totalExpenses');
        const netBalanceEl = document.getElementById('netBalance');
        const savingsRateEl = document.getElementById('savingsRate');
        
        if (totalIncomeEl) totalIncomeEl.textContent = `$${stats.totalIncome.toFixed(2)}`;
        if (totalExpensesEl) totalExpensesEl.textContent = `$${stats.totalExpenses.toFixed(2)}`;
        if (netBalanceEl) netBalanceEl.textContent = `$${stats.netBalance.toFixed(2)}`;
        if (savingsRateEl) savingsRateEl.textContent = `${stats.savingsRate}%`;

        // Update balance card color
        const balanceCard = document.querySelector('.net-balance');
        const balanceChange = document.getElementById('balanceChange');
        
        if (balanceCard && stats.netBalance >= 0) {
            balanceCard.style.setProperty('--card-gradient', 'linear-gradient(135deg, var(--success-color), #34d399)');
        } else if (balanceCard) {
            balanceCard.style.setProperty('--card-gradient', 'linear-gradient(135deg, var(--danger-color), #f87171)');
        }
        
        if (balanceChange) {
            if (stats.netBalance >= 0) {
                balanceChange.textContent = '+' + Math.abs(stats.balanceChangePercent).toFixed(1) + '%';
                balanceChange.className = 'card-change positive';
            } else {
                balanceChange.textContent = '-' + Math.abs(stats.balanceChangePercent).toFixed(1) + '%';
                balanceChange.className = 'card-change negative';
            }
        }

        // Update other change indicators
        const incomeChange = document.getElementById('incomeChange');
        const expenseChange = document.getElementById('expenseChange');
        
        if (incomeChange) incomeChange.textContent = `+${stats.incomeChangePercent.toFixed(1)}%`;
        if (expenseChange) expenseChange.textContent = `+${stats.expenseChangePercent.toFixed(1)}%`;
    }

    updateQuickStats() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlySavings = monthlyIncome - monthlyExpenses;

        const monthlyIncomeEl = document.getElementById('monthlyIncome');
        const monthlyExpensesEl = document.getElementById('monthlyExpenses');
        const monthlySavingsEl = document.getElementById('monthlySavings');
        
        if (monthlyIncomeEl) monthlyIncomeEl.textContent = `${monthlyIncome.toFixed(2)}`;
        if (monthlyExpensesEl) monthlyExpensesEl.textContent = `${monthlyExpenses.toFixed(2)}`;
        if (monthlySavingsEl) monthlySavingsEl.textContent = `${monthlySavings.toFixed(2)}`;
    }

    updateCategoryBreakdown() {
        const categoryBreakdown = document.getElementById('categoryBreakdown');
        if (!categoryBreakdown) return;
        
        const expensesByCategory = {};

        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        const sortedCategories = Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        if (sortedCategories.length === 0) {
            categoryBreakdown.innerHTML = '<p class="text-muted">No expenses yet</p>';
            return;
        }

        categoryBreakdown.innerHTML = sortedCategories
            .map(([category, amount]) => `
                <div class="category-item">
                    <span class="category-name">${category}</span>
                    <span class="category-amount">${amount.toFixed(2)}</span>
                </div>
            `).join('');
    }

    updateTransactionsTable() {
        const filteredTransactions = this.getFilteredTransactions();
        const totalPages = Math.ceil(filteredTransactions.length / this.transactionsPerPage);
        const startIndex = (this.currentPage - 1) * this.transactionsPerPage;
        const endIndex = startIndex + this.transactionsPerPage;
        const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

        const tbody = document.getElementById('transactionsTableBody');
        const emptyState = document.getElementById('emptyState');

        if (!tbody || !emptyState) return;

        if (paginatedTransactions.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            const pagination = document.getElementById('pagination');
            if (pagination) pagination.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = paginatedTransactions
            .map(transaction => this.createTransactionRow(transaction))
            .join('');

        this.updatePagination(totalPages, filteredTransactions.length);
    }

    createTransactionRow(transaction) {
        const formattedDate = this.formatDate(transaction.date);
        const formattedAmount = transaction.amount.toFixed(2);
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>
                    <div>
                        <strong>${transaction.description}</strong>
                        ${transaction.notes ? `<br><small class="text-muted">${transaction.notes}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="transaction-category ${transaction.type}">
                        ${transaction.category}
                    </span>
                </td>
                <td>
                    <span class="transaction-type ${transaction.type}">
                        <i class="fas fa-arrow-${transaction.type === 'income' ? 'up' : 'down'}"></i>
                        ${transaction.type}
                    </span>
                </td>
                <td>
                    <span class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${formattedAmount}
                    </span>
                </td>
                <td>
                    <div class="transaction-actions">
                        <button class="action-btn-sm" onclick="expenseTracker.editTransaction(${transaction.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn-sm delete" onclick="expenseTracker.deleteTransaction(${transaction.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updatePagination(totalPages, totalItems) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="expenseTracker.changePage(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="expenseTracker.changePage(1)">1</button>
            `;
            if (startPage > 2) {
                paginationHTML += '<span class="pagination-info">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="expenseTracker.changePage(${i})">${i}</button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span class="pagination-info">...</span>';
            }
            paginationHTML += `
                <button class="pagination-btn" onclick="expenseTracker.changePage(${totalPages})">${totalPages}</button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="expenseTracker.changePage(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        // Items info
        const startItem = (this.currentPage - 1) * this.transactionsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.transactionsPerPage, totalItems);
        paginationHTML += `
            <span class="pagination-info">
                Showing ${startItem}-${endItem} of ${totalItems} transactions
            </span>
        `;

        pagination.innerHTML = paginationHTML;
    }

    changePage(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.updateTransactionsTable();
    }

    updateFilterOptions() {
        const categories = [...new Set(this.transactions.map(t => t.category))];
        const filterSelect = document.getElementById('filterCategory');
        
        if (!filterSelect) return;
        
        const currentValue = filterSelect.value;
        filterSelect.innerHTML = '<option value="">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === currentValue) option.selected = true;
            filterSelect.appendChild(option);
        });
    }

    // Filtering and Search
    getFilteredTransactions() {
        let filtered = [...this.transactions];
        
        // Search filter
        const searchEl = document.getElementById('searchTransactions');
        const searchTerm = searchEl ? searchEl.value.toLowerCase() : '';
        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(searchTerm) ||
                t.category.toLowerCase().includes(searchTerm) ||
                (t.notes && t.notes.toLowerCase().includes(searchTerm))
            );
        }

        // Type filter
        const typeFilterEl = document.getElementById('filterType');
        const typeFilter = typeFilterEl ? typeFilterEl.value : '';
        if (typeFilter) {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Category filter
        const categoryFilterEl = document.getElementById('filterCategory');
        const categoryFilter = categoryFilterEl ? categoryFilterEl.value : '';
        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // Period filter
        const periodFilterEl = document.getElementById('filterPeriod');
        const periodFilter = periodFilterEl ? periodFilterEl.value : '';
        if (periodFilter) {
            filtered = this.filterByPeriod(filtered, periodFilter);
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    filterByPeriod(transactions, period) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (period) {
            case 'today':
                return transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startOfDay;
                });
            
            case 'week':
                const startOfWeek = new Date(startOfDay);
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                return transactions.filter(t => new Date(t.date) >= startOfWeek);
            
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return transactions.filter(t => new Date(t.date) >= startOfMonth);
            
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
                return transactions.filter(t => new Date(t.date) >= startOfQuarter);
            
            case 'year':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return transactions.filter(t => new Date(t.date) >= startOfYear);
            
            default:
                return transactions;
        }
    }

    filterTransactions() {
        this.currentPage = 1;
        this.updateTransactionsTable();
    }

    // Charts
    initializeCharts() {
        this.initializeExpenseChart();
        this.initializeTrendChart();
    }

    initializeExpenseChart() {
        const ctx = document.getElementById('expenseChart');
        if (!ctx) return;
        
        this.charts.expenseChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
                        '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    initializeTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        this.charts.trendChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Income',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    updateCharts() {
        this.updateExpenseChart();
        this.updateTrendChart();
    }

    updateExpenseChart() {
        if (!this.charts.expenseChart) return;
        
        const chartPeriodEl = document.getElementById('chartPeriod');
        const period = chartPeriodEl ? chartPeriodEl.value : 'all';
        let filteredTransactions = this.transactions.filter(t => t.type === 'expense');
        
        if (period !== 'all') {
            filteredTransactions = this.filterByPeriod(filteredTransactions, period);
        }

        const expensesByCategory = {};
        filteredTransactions.forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

        const sortedCategories = Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a);

        this.charts.expenseChart.data.labels = sortedCategories.map(([category]) => category);
        this.charts.expenseChart.data.datasets[0].data = sortedCategories.map(([,amount]) => amount);
        this.charts.expenseChart.update();
    }

    updateTrendChart() {
        if (!this.charts.trendChart) return;
        
        const monthlyData = this.getMonthlyTrendData();
        
        this.charts.trendChart.data.labels = monthlyData.labels;
        this.charts.trendChart.data.datasets[0].data = monthlyData.income;
        this.charts.trendChart.data.datasets[1].data = monthlyData.expenses;
        this.charts.trendChart.update();
    }

    getMonthlyTrendData() {
        const now = new Date();
        const months = [];
        const income = [];
        const expenses = [];

        // Get last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months.push(monthName);

            const monthlyTransactions = this.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === date.getMonth() && 
                       transactionDate.getFullYear() === date.getFullYear();
            });

            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            income.push(monthlyIncome);
            expenses.push(monthlyExpenses);
        }

        return { labels: months, income, expenses };
    }

    // Statistics
    calculateStats() {
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const currentYear = new Date().getFullYear();
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netBalance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

        // Calculate month-over-month changes
        const currentMonthIncome = this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'income' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthIncome = this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'income' && 
                       date.getMonth() === lastMonth && 
                       date.getFullYear() === lastMonthYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const currentMonthExpenses = this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const lastMonthExpenses = this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       date.getMonth() === lastMonth && 
                       date.getFullYear() === lastMonthYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const incomeChangePercent = lastMonthIncome > 0 
            ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 
            : 0;

        const expenseChangePercent = lastMonthExpenses > 0 
            ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
            : 0;

        const currentMonthBalance = currentMonthIncome - currentMonthExpenses;
        const lastMonthBalance = lastMonthIncome - lastMonthExpenses;
        const balanceChangePercent = lastMonthBalance !== 0 
            ? ((currentMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100 
            : 0;

        return {
            totalIncome,
            totalExpenses,
            netBalance,
            savingsRate,
            incomeChangePercent,
            expenseChangePercent,
            balanceChangePercent
        };
    }

    // Theme Management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        this.showToast(`Switched to ${this.theme} theme`, 'info');
    }

    // Data Management
    exportData() {
        try {
            const dataToExport = {
                transactions: this.transactions,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Data exported successfully!', 'success');
        } catch (error) {
            this.showError('Failed to export data. Please try again.');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.transactions || !Array.isArray(importedData.transactions)) {
                    throw new Error('Invalid file format');
                }

                const confirmMessage = `This will import ${importedData.transactions.length} transactions. Do you want to continue?`;
                if (confirm(confirmMessage)) {
                    const merge = confirm('Click OK to merge with existing data, or Cancel to replace all data.');
                    
                    if (merge) {
                        // Add unique IDs to imported transactions to avoid conflicts
                        const newTransactions = importedData.transactions.map(t => ({
                            ...t,
                            id: Date.now() + Math.random() + Math.random()
                        }));
                        this.transactions = [...this.transactions, ...newTransactions];
                    } else {
                        this.transactions = importedData.transactions;
                    }
                    
                    this.updateAllDisplays();
                    this.showToast('Data imported successfully!', 'success');
                }
            } catch (error) {
                this.showError('Invalid file format. Please select a valid backup file.');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    clearAllData() {
        if (!confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete all your financial data. Are you absolutely sure?')) {
            return;
        }

        try {
            this.transactions = [];
            this.updateAllDisplays();
            this.showToast('All data cleared successfully!', 'success');
        } catch (error) {
            this.showError('Failed to clear data. Please try again.');
        }
    }

    generateReport() {
        try {
            const stats = this.calculateStats();
            const reportData = this.generateReportData();
            
            // Create a simple text report
            let report = `EXPENSE TRACKER REPORT\n`;
            report += `Generated on: ${new Date().toLocaleDateString()}\n`;
            report += `${'='.repeat(50)}\n\n`;
            
            report += `SUMMARY\n`;
            report += `${'='.repeat(20)}\n`;
            report += `Total Income: ${stats.totalIncome.toFixed(2)}\n`;
            report += `Total Expenses: ${stats.totalExpenses.toFixed(2)}\n`;
            report += `Net Balance: ${stats.netBalance.toFixed(2)}\n`;
            report += `Savings Rate: ${stats.savingsRate}%\n\n`;
            
            report += `TOP EXPENSE CATEGORIES\n`;
            report += `${'='.repeat(30)}\n`;
            reportData.topCategories.forEach((cat, index) => {
                report += `${index + 1}. ${cat.name}: ${cat.amount.toFixed(2)}\n`;
            });
            
            report += `\nMONTHLY BREAKDOWN\n`;
            report += `${'='.repeat(25)}\n`;
            reportData.monthlyBreakdown.forEach(month => {
                report += `${month.month}: Income ${month.income.toFixed(2)}, `;
                report += `Expenses ${month.expenses.toFixed(2)}, `;
                report += `Net ${(month.income - month.expenses).toFixed(2)}\n`;
            });
            
            // Download the report
            const reportBlob = new Blob([report], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(reportBlob);
            link.download = `expense-report-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Report generated successfully!', 'success');
        } catch (error) {
            this.showError('Failed to generate report. Please try again.');
        }
    }

    generateReportData() {
        // Top expense categories
        const expensesByCategory = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        const topCategories = Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, amount]) => ({ name, amount }));

        // Monthly breakdown (last 12 months)
        const monthlyBreakdown = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            const monthlyTransactions = this.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === date.getMonth() && 
                       transactionDate.getFullYear() === date.getFullYear();
            });

            const income = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            monthlyBreakdown.push({
                month: monthName,
                income,
                expenses
            });
        }

        return {
            topCategories,
            monthlyBreakdown
        };
    }

    // Modal Management
    showModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.currentTransactionId = null;
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toast.style.backgroundColor = colors[type] || colors.info;

        // Add icon
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showWelcomeMessage() {
        if (this.transactions.length === 0) {
            setTimeout(() => {
                this.showToast('Welcome to Expense Tracker Pro! Start by adding your first transaction.', 'info');
            }, 1000);
        }
    }
}

// Initialize the expense tracker when the page loads
let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTrackerPro();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpenseTrackerPro;
}