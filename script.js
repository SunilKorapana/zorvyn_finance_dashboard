// ==================== MOCK DATA ====================
let transactions = [
  { id: 1, date: "2025-02-10", description: "Grocery Store", amount: 85.50, category: "Food", type: "expense" },
  { id: 2, date: "2025-02-05", description: "Salary Feb", amount: 3200.00, category: "Salary", type: "income" },
  { id: 3, date: "2025-01-28", description: "Uber Ride", amount: 22.40, category: "Transport", type: "expense" },
  { id: 4, date: "2025-01-20", description: "Netflix Subscription", amount: 15.99, category: "Bills", type: "expense" },
  { id: 5, date: "2025-01-15", description: "Freelance project", amount: 500.00, category: "Freelance", type: "income" },
  { id: 6, date: "2025-02-01", description: "New Headphones", amount: 79.99, category: "Shopping", type: "expense" },
  { id: 7, date: "2025-01-05", description: "Gym Membership", amount: 45.00, category: "Bills", type: "expense" },
  { id: 8, date: "2024-12-20", description: "Holiday Bonus", amount: 800.00, category: "Salary", type: "income" },
  { id: 9, date: "2025-02-12", description: "Restaurant Dinner", amount: 62.30, category: "Food", type: "expense" }
];

// ==================== STATE VARIABLES ====================
let currentFilterType = "all";
let currentSearch = "";
let currentSort = "date-desc";

// Chart instances
let trendChart = null;
let categoryChart = null;

// ==================== HELPER FUNCTIONS ====================
function getCurrentRole() {
  return document.getElementById("roleSwitcher").value;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ==================== SUMMARY CARDS ====================
function computeSummary() {
  let totalIncome = 0, totalExpense = 0;
  transactions.forEach(t => {
    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;
  });
  const balance = totalIncome - totalExpense;
  return { totalIncome, totalExpense, balance };
}

function renderSummary() {
  const { totalIncome, totalExpense, balance } = computeSummary();
  const summaryHtml = `
    <div class="card">
      <div class="card-title"><i class="fas fa-wallet"></i> Total Balance</div>
      <div class="card-amount balance-amount">$${balance.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-title"><i class="fas fa-arrow-up"></i> Income</div>
      <div class="card-amount income-amount">$${totalIncome.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-title"><i class="fas fa-arrow-down"></i> Expenses</div>
      <div class="card-amount expense-amount">$${totalExpense.toFixed(2)}</div>
    </div>
  `;
  document.getElementById("summaryGrid").innerHTML = summaryHtml;
}

// ==================== FILTER + SORT + SEARCH ====================
function getFilteredSortedTransactions() {
  let filtered = [...transactions];
  
  // Type filter
  if (currentFilterType !== "all") {
    filtered = filtered.filter(t => t.type === currentFilterType);
  }
  
  // Search filter
  if (currentSearch.trim() !== "") {
    const term = currentSearch.trim().toLowerCase();
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(term) || 
      t.amount.toString().includes(term)
    );
  }
  
  // Sorting
  switch(currentSort) {
    case "date-desc":
      filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
      break;
    case "date-asc":
      filtered.sort((a,b) => new Date(a.date) - new Date(b.date));
      break;
    case "amount-desc":
      filtered.sort((a,b) => b.amount - a.amount);
      break;
    case "amount-asc":
      filtered.sort((a,b) => a.amount - b.amount);
      break;
    default:
      break;
  }
  return filtered;
}

// ==================== TRANSACTIONS RENDERING ====================
function renderTransactions() {
  const listContainer = document.getElementById("transactionsList");
  const filtered = getFilteredSortedTransactions();
  const role = getCurrentRole();
  const isAdmin = role === "admin";
  
  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="empty-message"><i class="fas fa-receipt"></i> No transactions match</div>`;
    return;
  }
  
  listContainer.innerHTML = filtered.map(t => `
    <div class="transaction-item" data-id="${t.id}">
      <div class="transaction-info">
        <span class="transaction-date">${t.date}</span>
        <span><strong>${escapeHtml(t.description)}</strong></span>
        <span class="transaction-category">${t.category}</span>
        <span class="transaction-amount ${t.type}">${t.type === "expense" ? "-" : "+"}$${t.amount.toFixed(2)}</span>
      </div>
      <div class="transaction-actions">
        ${isAdmin ? `<button class="edit-btn" data-id="${t.id}" title="Edit"><i class="fas fa-edit"></i></button>
                     <button class="delete-btn" data-id="${t.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>` : ''}
      </div>
    </div>
  `).join('');
  
  // Attach event listeners for admin actions
  if (isAdmin) {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        editTransaction(id);
      });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        deleteTransaction(id);
      });
    });
  }
}

// ==================== CRUD OPERATIONS (ADMIN) ====================
function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;
  
  const newDesc = prompt("Edit description:", transaction.description);
  if (newDesc !== null && newDesc.trim() !== "") transaction.description = newDesc.trim();
  
  const newAmount = prompt("Edit amount (number):", transaction.amount);
  if (newAmount !== null && !isNaN(parseFloat(newAmount)) && parseFloat(newAmount) > 0) {
    transaction.amount = parseFloat(newAmount);
  }
  
  const newCat = prompt("Edit category (Food, Transport, Shopping, Bills, Salary, Freelance):", transaction.category);
  if (newCat !== null && newCat.trim() !== "") transaction.category = newCat.trim();
  
  renderAll();
  updateChartsAndInsights();
}

function deleteTransaction(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    transactions = transactions.filter(t => t.id !== id);
    renderAll();
    updateChartsAndInsights();
  }
}

function addTransaction(desc, amount, category, type) {
  if (!desc || desc.trim() === "") {
    alert("Please enter a description");
    return false;
  }
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid positive amount");
    return false;
  }
  
  const newId = Date.now();
  const newTrans = {
    id: newId,
    date: new Date().toISOString().slice(0,10),
    description: desc.trim(),
    amount: parseFloat(amount),
    category: category,
    type: type
  };
  transactions.unshift(newTrans);
  renderAll();
  updateChartsAndInsights();
  return true;
}

// ==================== INSIGHTS ====================
function computeInsights() {
  const expenses = transactions.filter(t => t.type === "expense");
  const categoryMap = new Map();
  expenses.forEach(exp => {
    categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
  });
  
  let highestCat = "None", highestAmt = 0;
  for (let [cat, amt] of categoryMap.entries()) {
    if (amt > highestAmt) {
      highestAmt = amt;
      highestCat = cat;
    }
  }
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const percent = totalExpenses > 0 && highestAmt > 0 ? ((highestAmt / totalExpenses) * 100).toFixed(0) : 0;
  
  // Monthly comparison
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let currentMonthExp = 0, prevMonthExp = 0;
  
  transactions.forEach(t => {
    if (t.type !== "expense") return;
    const d = new Date(t.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      currentMonthExp += t.amount;
    }
    if (d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear) {
      prevMonthExp += t.amount;
    } else if (currentMonth === 0 && d.getMonth() === 11 && d.getFullYear() === currentYear - 1) {
      prevMonthExp += t.amount;
    }
  });
  
  let monthlyCompare = `No prior month data`;
  if (prevMonthExp > 0) {
    const diff = currentMonthExp - prevMonthExp;
    const percentChange = ((diff / prevMonthExp) * 100).toFixed(1);
    monthlyCompare = `${diff >= 0 ? '🔺' : '🔻'} ${Math.abs(diff).toFixed(2)} (${percentChange}%) vs last month`;
  } else if (currentMonthExp > 0) {
    monthlyCompare = `✨ New spending this month: $${currentMonthExp.toFixed(2)}`;
  }
  
  return { highestCat, highestAmt, percent, monthlyCompare, currentMonthExp };
}

function renderInsights() {
  const { highestCat, highestAmt, percent, monthlyCompare, currentMonthExp } = computeInsights();
  const insightsHtml = `
    <div class="insight-card">
      <div class="insight-title"><i class="fas fa-chart-simple"></i> Top Spending Category</div>
      ${highestCat !== "None" ? `${highestCat} : $${highestAmt.toFixed(2)} (${percent}% of expenses)` : "No expenses recorded yet"}
    </div>
    <div class="insight-card">
      <div class="insight-title"><i class="fas fa-calendar-week"></i> Monthly Trend</div>
      ${monthlyCompare}<br>
      Current month expenses: $${currentMonthExp.toFixed(2)}
    </div>
    <div class="insight-card">
      <div class="insight-title"><i class="fas fa-coins"></i> Smart Tip</div>
      ${highestCat !== "None" ? `Consider setting a budget for "${highestCat}" to optimize savings` : "Add more transactions to receive personalized insights!"}
    </div>
  `;
  document.getElementById("insightsContainer").innerHTML = insightsHtml;
}

// ==================== CHARTS ====================
function renderTrendChart() {
  const months = [];
  const monthlyBal = [];
  for (let i = 5; i >= 0; i--) {
    let date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.push(monthNames[date.getMonth()]);
    
    let month = date.getMonth();
    let year = date.getFullYear();
    let incomeSum = 0, expenseSum = 0;
    transactions.forEach(t => {
      let td = new Date(t.date);
      if (td.getMonth() === month && td.getFullYear() === year) {
        if (t.type === "income") incomeSum += t.amount;
        else expenseSum += t.amount;
      }
    });
    monthlyBal.push(incomeSum - expenseSum);
  }
  
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Balance (USD)',
        data: monthlyBal,
        borderColor: '#2a5298',
        backgroundColor: 'rgba(42,82,152,0.05)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'top' } }
    }
  });
}

function renderCategoryChart() {
  const expenses = transactions.filter(t => t.type === "expense");
  const catTotal = {};
  expenses.forEach(exp => {
    catTotal[exp.category] = (catTotal[exp.category] || 0) + exp.amount;
  });
  const labels = Object.keys(catTotal);
  const data = Object.values(catTotal);
  
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#3b82f6', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function updateChartsAndInsights() {
  renderTrendChart();
  renderCategoryChart();
  renderInsights();
}

// ==================== ROLE UI TOGGLE ====================
function toggleAddFormBasedOnRole() {
  const role = getCurrentRole();
  const formDiv = document.getElementById("addTransactionForm");
  if (role === "admin") {
    formDiv.style.display = "flex";
  } else {
    formDiv.style.display = "none";
  }
}

// ==================== MASTER RENDER ====================
function renderAll() {
  renderSummary();
  renderTransactions();
  toggleAddFormBasedOnRole();
}

// ==================== EVENT LISTENERS & INIT ====================
function initEventListeners() {
  document.getElementById("roleSwitcher").addEventListener("change", () => {
    renderAll();
  });
  
  document.getElementById("typeFilter").addEventListener("change", (e) => {
    currentFilterType = e.target.value;
    renderTransactions();
  });
  
  document.getElementById("searchInput").addEventListener("input", (e) => {
    currentSearch = e.target.value;
    renderTransactions();
  });
  
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderTransactions();
  });
  
  document.getElementById("addTransactionBtn").addEventListener("click", () => {
    if (getCurrentRole() !== "admin") {
      alert("Only admin can add transactions");
      return;
    }
    const desc = document.getElementById("newDesc").value;
    const amount = parseFloat(document.getElementById("newAmount").value);
    const category = document.getElementById("newCategory").value;
    const type = document.getElementById("newType").value;
    if (addTransaction(desc, amount, category, type)) {
      document.getElementById("newDesc").value = "";
      document.getElementById("newAmount").value = "";
    }
  });
}

function init() {
  initEventListeners();
  renderAll();
  updateChartsAndInsights();
}

// Start the application
init();