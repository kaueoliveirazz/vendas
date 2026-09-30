document.addEventListener('DOMContentLoaded', () => {
    // State
    let sales = JSON.parse(localStorage.getItem('shopee_sales')) || [];
    let expenses = JSON.parse(localStorage.getItem('shopee_expenses')) || [];
    let notes = localStorage.getItem('shopee_notes') || '';
    
    // DOM Elements - Sales
    const saleForm = document.getElementById('sale-form');
    const saleDateInput = document.getElementById('sale-date');
    const historyDateInput = document.getElementById('history-date');
    const salesTableList = document.getElementById('sales-list');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');
    const todayCountEl = document.getElementById('today-count');
    const todayRevenueEl = document.getElementById('today-revenue');
    
    // DOM Elements - Expenses
    const expenseForm = document.getElementById('expense-form');
    const expenseDateInput = document.getElementById('expense-date');
    const expensesTableList = document.getElementById('expenses-list');
    
    // DOM Elements - Monthly
    const monthPicker = document.getElementById('month-picker');
    const monthlyRevenueEl = document.getElementById('monthly-revenue');
    const monthlySalesCountEl = document.getElementById('monthly-sales-count');
    const monthlyExpensesEl = document.getElementById('monthly-expenses');
    const monthlyProfitEl = document.getElementById('monthly-profit');
    const monthlyProfitCard = document.getElementById('monthly-profit-card');
    
    // DOM Elements - Notes & Other
    const notesArea = document.getElementById('notes-area');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const toast = document.getElementById('toast');

    // Init Dates
    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
    
    historyDateInput.value = todayStr;
    saleDateInput.value = todayStr;
    expenseDateInput.value = todayStr;
    monthPicker.value = currentMonthStr;
    notesArea.value = notes;

    // Initialize UI
    updateDashboard(todayStr);
    renderSalesForDate(todayStr);
    renderExpensesForDate(todayStr);
    updateMonthlyReport(currentMonthStr);

    // --- Tab Switching Logic ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Date Sync Logic ---
    function syncDateFields(newDate) {
        if(saleDateInput.value !== newDate) saleDateInput.value = newDate;
        if(historyDateInput.value !== newDate) historyDateInput.value = newDate;
        if(expenseDateInput.value !== newDate) expenseDateInput.value = newDate;
        
        updateDashboard(newDate);
        renderSalesForDate(newDate);
        renderExpensesForDate(newDate);
    }

    historyDateInput.addEventListener('change', (e) => syncDateFields(e.target.value));
    saleDateInput.addEventListener('change', (e) => syncDateFields(e.target.value));
    expenseDateInput.addEventListener('change', (e) => syncDateFields(e.target.value));

    // --- Month Picker Logic ---
    monthPicker.addEventListener('change', (e) => {
        updateMonthlyReport(e.target.value);
    });

    // --- Sales Logic ---
    saleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const size = document.querySelector('input[name="size"]:checked').value;
        const color = document.getElementById('color').value.trim();
        const print = document.getElementById('print').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        if(!color || !print || isNaN(price)) return;

        const dateStr = saleDateInput.value;
        const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const newSale = {
            id: Date.now().toString(),
            date: dateStr,
            time: timeStr,
            size, color, print, price
        };
        sales.push(newSale);
        localStorage.setItem('shopee_sales', JSON.stringify(sales));

        updateDashboard(dateStr);
        renderSalesForDate(dateStr);
        updateMonthlyReport(monthPicker.value);
        
        saleForm.reset();
        saleDateInput.value = dateStr;
        document.querySelector('input[name="size"][value="M"]').checked = true;
        document.getElementById('color').focus();
        showToast('Venda registrada com sucesso!');
    });

    window.deleteSale = (id) => {
        if(confirm('Tem certeza que deseja excluir esta venda?')) {
            sales = sales.filter(s => s.id !== id);
            localStorage.setItem('shopee_sales', JSON.stringify(sales));
            const currentSelectedDate = historyDateInput.value;
            updateDashboard(currentSelectedDate);
            renderSalesForDate(currentSelectedDate);
            updateMonthlyReport(monthPicker.value);
            showToast('Venda excluída.');
        }
    };

    function renderSalesForDate(dateStr) {
        const filteredSales = sales.filter(s => s.date === dateStr);
        salesTableList.innerHTML = '';
        if (filteredSales.length === 0) {
            emptyState.classList.remove('hidden');
            tableContainer.style.display = 'none';
        } else {
            emptyState.classList.add('hidden');
            tableContainer.style.display = 'block';
            [...filteredSales].reverse().forEach(sale => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${sale.time}</td>
                    <td><span class="size-badge">${sale.size}</span></td>
                    <td>${sale.color}</td>
                    <td>${sale.print}</td>
                    <td class="price-cell">${formatCurrency(sale.price)}</td>
                    <td>
                        <button onclick="deleteSale('${sale.id}')" class="delete-btn" title="Excluir">DEL</button>
                    </td>
                `;
                salesTableList.appendChild(tr);
            });
        }
    }

    // --- Expenses Logic ---
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = document.getElementById('expense-desc').value.trim();
        const price = parseFloat(document.getElementById('expense-price').value);
        if(!desc || isNaN(price)) return;

        const dateStr = expenseDateInput.value;
        const newExpense = {
            id: 'exp_' + Date.now().toString(),
            date: dateStr,
            desc,
            price
        };
        expenses.push(newExpense);
        localStorage.setItem('shopee_expenses', JSON.stringify(expenses));

        renderExpensesForDate(dateStr);
        updateMonthlyReport(monthPicker.value);
        
        expenseForm.reset();
        expenseDateInput.value = dateStr;
        document.getElementById('expense-desc').focus();
        showToast('Despesa registrada com sucesso!');
    });

    window.deleteExpense = (id) => {
        if(confirm('Tem certeza que deseja excluir esta despesa?')) {
            expenses = expenses.filter(e => e.id !== id);
            localStorage.setItem('shopee_expenses', JSON.stringify(expenses));
            renderExpensesForDate(expenseDateInput.value);
            updateMonthlyReport(monthPicker.value);
            showToast('Despesa excluída.');
        }
    };

    function renderExpensesForDate(dateStr) {
        const filteredExpenses = expenses.filter(e => e.date === dateStr);
        expensesTableList.innerHTML = '';
        if(filteredExpenses.length === 0) {
            expensesTableList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nenhuma despesa neste dia.</td></tr>';
            return;
        }
        [...filteredExpenses].reverse().forEach(exp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${exp.desc}</td>
                <td style="color: var(--danger); font-weight: 600;">- ${formatCurrency(exp.price)}</td>
                <td>
                    <button onclick="deleteExpense('${exp.id}')" class="delete-btn" title="Excluir">DEL</button>
                </td>
            `;
            expensesTableList.appendChild(tr);
        });
    }

    // --- Monthly Logic ---
    function updateMonthlyReport(monthStr) {
        if(!monthStr) return;
        const monthSales = sales.filter(s => s.date.startsWith(monthStr));
        const monthExpenses = expenses.filter(e => e.date.startsWith(monthStr));

        const totalRevenue = monthSales.reduce((acc, curr) => acc + curr.price, 0);
        const totalExpenses = monthExpenses.reduce((acc, curr) => acc + curr.price, 0);
        const netProfit = totalRevenue - totalExpenses;

        monthlyRevenueEl.textContent = formatCurrency(totalRevenue);
        monthlySalesCountEl.textContent = `${monthSales.length} vendas registradas`;
        monthlyExpensesEl.textContent = formatCurrency(totalExpenses);
        monthlyProfitEl.textContent = formatCurrency(netProfit);

        if (netProfit < 0) {
            monthlyProfitCard.className = 'monthly-card net-loss';
        } else {
            monthlyProfitCard.className = 'monthly-card net-profit';
        }
    }

    // --- Notes Logic ---
    notesArea.addEventListener('input', (e) => {
        localStorage.setItem('shopee_notes', e.target.value);
    });

    // --- Helpers ---
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function updateDashboard(dateStr) {
        const daySales = sales.filter(s => s.date === dateStr);
        const revenue = daySales.reduce((acc, curr) => acc + curr.price, 0);
        todayCountEl.textContent = daySales.length;
        todayRevenueEl.textContent = formatCurrency(revenue);
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Calculator Logic ---
    const calcToggleBtn = document.getElementById('calc-toggle-btn');
    const calcPanel = document.getElementById('calc-panel');
    const calcDisplay = document.getElementById('calc-display');
    const calcBtns = document.querySelectorAll('.calc-btn');
    
    let calcValue = '0';
    let calcOp = null;
    let calcWaitNext = false;
    let calcPrevious = null;

    calcToggleBtn.addEventListener('click', () => {
        calcPanel.classList.toggle('hidden');
    });

    calcBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            const value = btn.getAttribute('data-value');

            if (value !== null) {
                if (calcWaitNext) {
                    calcValue = value;
                    calcWaitNext = false;
                } else {
                    calcValue = calcValue === '0' && value !== '.' ? value : calcValue + value;
                }
            } else if (action === 'clear') {
                calcValue = '0';
                calcPrevious = null;
                calcOp = null;
            } else if (action === 'delete') {
                calcValue = calcValue.length > 1 ? calcValue.slice(0, -1) : '0';
            } else if (action === 'percent') {
                calcValue = (parseFloat(calcValue) / 100).toString();
            } else if (['add', 'subtract', 'multiply', 'divide'].includes(action)) {
                if (calcOp && !calcWaitNext) {
                    calcValue = performCalculation(calcPrevious, calcValue, calcOp).toString();
                }
                calcPrevious = calcValue;
                calcOp = action;
                calcWaitNext = true;
            } else if (action === 'calculate') {
                if (calcOp && calcPrevious !== null) {
                    calcValue = performCalculation(calcPrevious, calcValue, calcOp).toString();
                    calcOp = null;
                    calcPrevious = null;
                    calcWaitNext = true;
                }
            }
            
            // Limit length
            if(calcValue.length > 12) calcValue = calcValue.substring(0, 12);
            calcDisplay.textContent = calcValue;
        });
    });

    function performCalculation(a, b, op) {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        switch(op) {
            case 'add': return numA + numB;
            case 'subtract': return numA - numB;
            case 'multiply': return numA * numB;
            case 'divide': return numB === 0 ? 0 : numA / numB;
            default: return numB;
        }
    }
});
