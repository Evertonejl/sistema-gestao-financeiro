// Função para obter o token de autenticação
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Função para verificar autenticação
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Função para fazer logout
function logout() {
    // Remover o token do localStorage e sessionStorage
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    
    // Redirecionar para a página de login
    window.location.href = '/login.html';
}

// Adicionar evento de click no botão de logout
document.getElementById('logoutBtn').addEventListener('click', logout);

// Função genérica para fazer requisições autenticadas
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = 'login.html';
            return;
        }

        return response;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}
// Função para atualizar o nome do usuário no header
function updateUserHeader() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        // Tenta pegar o nome do usuário do localStorage ou sessionStorage
        const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
        
        if (userName) {
            userNameElement.textContent = `Seja bem vindo, ${userName}`;
        } else {
            // Caso não encontre o nome, redireciona para o login
            window.location.href = 'login.html';
        }
    }
}

// Adicione a verificação quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    updateUserHeader();

    
    // Sidebar - Alternar visibilidade
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleSidebar");
    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("hidden");
    });

    // Scroll suave
    document.querySelectorAll('.scroll-to').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            window.scrollTo({
                top: targetSection.offsetTop,
                behavior: 'smooth'
            });
        });
    });

    // Função para obter a quantidade de clientes cadastrados por mês
    async function getClientsPerMonth() {
        try {
            const response = await fetchWithAuth('http://localhost:3000/api/clients');
            if (!response) return Array(6).fill(0);
            
            const clients = await response.json();
            const months = Array(12).fill(0);
            
            clients.forEach(client => {
                const date = new Date(client.date);
                if (!isNaN(date)) {
                    const monthIndex = date.getMonth();
                    months[monthIndex]++;
                }
            });
            return months.slice(0, 6);
        } catch (error) {
            console.error('Erro ao obter dados dos clientes:', error);
            return Array(6).fill(0);
        }
    }
    
    async function getExpensesPerMonth() {
        try {
            const response = await fetchWithAuth('http://localhost:3000/api/expenses');
            if (!response) return Array(6).fill(0);
            
            const expenses = await response.json();
            const months = Array(12).fill(0);
            
            expenses.forEach(expense => {
                const date = new Date(expense.expenseDate); // Mudou de date para expenseDate
                if (!isNaN(date)) {
                    const monthIndex = date.getMonth();
                    // Mudou de value para expenseValue
                    const value = parseFloat(expense.expenseValue) || 0;
                    months[monthIndex] += value;
                }
            });
    
            // Para debug
            console.log('Valores mensais de despesas:', months.slice(0, 6));
            
            return months.slice(0, 6);
        } catch (error) {
            console.error('Erro ao obter dados das despesas:', error);
            return Array(6).fill(0);
        }
    }
    
    // Chart.js - Configuração do gráfico
    try {
        const [clientsPerMonth, expensesPerMonth] = await Promise.all([
            getClientsPerMonth(),
            getExpensesPerMonth()
        ]);
    
        const ctx = document.getElementById("salesChart").getContext("2d");
        new Chart(ctx, {
            type: "line",
            data: {
                labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                datasets: [
                    {
                        label: "Clientes Cadastrados Mensais",
                        data: clientsPerMonth,
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 2,
                        yAxisID: 'y', // Eixo principal para clientes
                    },
                    {
                        label: "Despesas Mensais",
                        data: expensesPerMonth,
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 2,
                        yAxisID: 'y1', // Eixo secundário para despesas
                    }
                ],
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Número de Clientes'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Valor das Despesas (R$)'
                        },
                        grid: {
                            drawOnChartArea: false // Não desenha a grade do eixo secundário
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao criar gráfico:', error);
        
    }

    // Leaflet.js - Configuração do Mapa
    const map = L.map("usMap").setView([-26.9131, -49.0333], 10);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
    }).addTo(map);

    L.marker([-26.9131, -49.0333]).addTo(map)
        .bindPopup("Pomerode")
        .openPopup();

    L.circle([-26.9131, -49.0333], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 5000,
    }).addTo(map);

    const latlngs = [
        [-26.9131, -49.0333],
        [-26.9141, -49.0343],
        [-26.9121, -49.0323]
    ];
    L.polygon(latlngs, { color: 'green' }).addTo(map);

    map.zoomControl.setPosition('topright');
    map.locate({ setView: true, maxZoom: 16 });

    // Carregar dados iniciais
    await Promise.all([
        fetchClients(),
        fetchExpenses(),
        displayTotals(),
        calculateProfit()
    ]);

    // Modal - Gerenciamento de exibição
    const modal = document.getElementById("modal");
    const openModalBtn = document.querySelector(".sidebar-btn");
    const closeModalBtn = document.querySelector(".close");

    openModalBtn.addEventListener("click", () => {
        modal.style.display = "block";
    });

    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Máscara de telefone
    document.getElementById("phone").addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d{5})(\d{4})$/, "$1-$2");
        e.target.value = value;
    });
});

// Funções relacionadas à tabela e API
const tableBody = document.getElementById("tableBody");
const expenseTableBody = document.getElementById("expenseTableBody");

// Função para calcular e exibir totais
async function displayTotals() {
    try {
        const [clientsResponse, expensesResponse] = await Promise.all([
            fetchWithAuth('http://localhost:3000/api/clients'),
            fetchWithAuth('http://localhost:3000/api/expenses')
        ]);

        if (!clientsResponse || !expensesResponse) return;

        const [clients, expenses] = await Promise.all([
            clientsResponse.json(),
            expensesResponse.json()
        ]);

        const totalRevenue = clients.reduce((acc, client) => {
            const value = parseFloat(client.value) || 0;
            return acc + value;
        }, 0);

        const totalExpenses = expenses.reduce((acc, expense) => {
            const value = parseFloat(expense.expenseValue) || 0;
            return acc + value;
        }, 0);

        const profit = totalRevenue - totalExpenses;

        const elements = {
            revenue: document.getElementById("totalRevenue"),
            expenses: document.getElementById("totalExpenses"),
            clientCount: document.getElementById("clientCount"),
            profit: document.getElementById("profit")
        };

        if (elements.revenue) {
            elements.revenue.textContent = `Total Entradas: R$ ${totalRevenue.toFixed(2)}`;
        }
        if (elements.expenses) {
            elements.expenses.textContent = `Total Despesas: R$ ${totalExpenses.toFixed(2)}`;
        }
        if (elements.clientCount && Array.isArray(clients)) {
            elements.clientCount.textContent = `Total de clientes: ${clients.length}`;
        }
        if (elements.profit) {
            elements.profit.textContent = `R$ ${profit.toFixed(2)}`;
            elements.profit.className = profit >= 0 ? 'positive' : 'negative';
        }
    } catch (error) {
        console.error('Erro ao calcular totais:', error);
    }
}

// Função para calcular lucro
async function calculateProfit() {
    try {
        const [clientsResponse, expensesResponse] = await Promise.all([
            fetchWithAuth('http://localhost:3000/api/clients'),
            fetchWithAuth('http://localhost:3000/api/expenses')
        ]);

        if (!clientsResponse || !expensesResponse) return 0;

        const [clients, expenses] = await Promise.all([
            clientsResponse.json(),
            expensesResponse.json()
        ]);

        const totalRevenue = clients.reduce((acc, client) => {
            const value = parseFloat(client.value) || 0;
            return acc + value;
        }, 0);

        const totalExpenses = expenses.reduce((acc, expense) => {
            const value = parseFloat(expense.expenseValue) || 0;
            return acc + value;
        }, 0);

        const profit = totalRevenue - totalExpenses;

        const profitElement = document.getElementById("profit");
        if (profitElement) {
            profitElement.textContent = `R$ ${profit.toFixed(2)}`;
            profitElement.className = profit >= 0 ? 'positive' : 'negative';
        }

        return profit;
    } catch (error) {
        console.error('Erro ao calcular lucro:', error);
        return 0;
    }
}

// Função para buscar clientes
async function fetchClients() {
    try {
        const response = await fetchWithAuth('http://localhost:3000/api/clients');
        if (!response) return;
        
        const clients = await response.json();
        tableBody.innerHTML = '';

        if (Array.isArray(clients)) {
            clients.forEach(client => addRowToTable(client));
            document.getElementById('clientCount').textContent = `Total de clientes: ${clients.length}`;
        }
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
    }
}

// Função para adicionar linha à tabela de clientes
function addRowToTable(client) {
    const existingRow = Array.from(tableBody.rows).find(row =>
        row.cells[0].textContent === client.clientName &&
        row.cells[1].textContent === client.email &&
        row.cells[2].textContent === client.phone
    );
    if (existingRow) return;

    const row = document.createElement('tr');
    row.dataset.id = client.id;
    row.innerHTML = `
        <td>${client.clientName}</td>
        <td>${client.email}</td>
        <td>${client.phone}</td>
        <td>${client.date}</td>
        <td>${client.type}</td>
        <td>${client.plan}</td>
        <td>R$ ${parseFloat(client.value).toFixed(2)}</td>
        <td class="action-icons">
            <i class="fas fa-edit" onclick="editRow(this)"></i>
            <i class="fas fa-trash" onclick="deleteRow(this)"></i>
        </td>
    `;
    tableBody.appendChild(row);
}

// Função para deletar cliente
async function deleteRow(button) {
    const row = button.closest("tr");
    const clientId = row.dataset.id;

    if (!clientId) {
        console.error('ID do cliente não encontrado');
        return;
    }

    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/clients/${clientId}`, {
            method: 'DELETE'
        });

        if (!response) return;

        if (response.ok) {
            row.remove();
            await Promise.all([
                calculateProfit(),
                displayTotals()
            ]);
        }
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        alert('Erro ao deletar cliente');
    }
}

// Função para editar cliente
async function editRow(button) {
    const row = button.closest("tr");
    const clientId = row.dataset.id;
    const cells = row.querySelectorAll("td");

    document.getElementById("clientName").value = cells[0].textContent;
    document.getElementById("email").value = cells[1].textContent;
    document.getElementById("phone").value = cells[2].textContent;
    document.getElementById("date").value = cells[3].textContent;
    document.getElementById("type").value = cells[4].textContent;
    document.getElementById("plan").value = cells[5].textContent;
    document.getElementById("value").value = cells[6].textContent.replace("R$ ", "");

    const dataForm = document.getElementById("dataForm");
    const modal = document.getElementById("modal");

    dataForm.onsubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(dataForm);
        const updatedData = Object.fromEntries(formData.entries());

        try {
            const response = await fetchWithAuth(`http://localhost:3000/api/clients/${clientId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });

            if (!response) return;

            if (response.ok) {
                modal.style.display = "none";
                dataForm.reset();
                await Promise.all([
                    fetchClients(),
                    calculateProfit(),
                    displayTotals()
                ]);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao atualizar cliente');
        }
    };

    modal.style.display = "block";
}

// Submeter o formulário de clientes
const dataForm = document.getElementById("dataForm");
dataForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
        const formData = new FormData(dataForm);
        const data = Object.fromEntries(formData.entries());

        const clientsResponse = await fetchWithAuth('http://localhost:3000/api/clients');
        if (!clientsResponse) return;

        const clients = await clientsResponse.json();
        const isDuplicate = clients.some(client =>
            client.clientName === data.clientName &&
            client.email === data.email &&
            client.phone === data.phone
        );

        if (isDuplicate) {
            alert("Este cliente já foi cadastrado!");
            return;
        }

        await saveClientToAPI(data);
    } catch (error) {
        console.error('Erro ao processar formulário:', error);
        alert('Erro ao processar formulário');
    }
});

// Salvar cliente na API
async function saveClientToAPI(data) {
    try {
        const response = await fetchWithAuth('http://localhost:3000/api/clients', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response) return;

        const client = await response.json();
        addRowToTable(client);
        await Promise.all([
            displayTotals(),
            calculateProfit(),
            fetchClients()
        ]);
        modal.style.display = "none";
        dataForm.reset();
    } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        alert("Erro ao salvar cliente");
    }
}

// Função para filtrar a tabela
function filterTable() {
    const clientFilter = document.getElementById('clientSearch').value.toLowerCase();
    const dateFilter = document.getElementById('dateSearch').value;
    const typeFilter = document.getElementById('typeSearch').value;
    
    const rows = tableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const clientName = row.cells[0].textContent.toLowerCase();
        const date = row.cells[3].textContent;
        const type = row.cells[4].textContent;
        
        const matchesClient = clientName.includes(clientFilter);
        const matchesDate = !dateFilter || date.includes(dateFilter);
        const matchesType = !typeFilter || type === typeFilter;
        
        row.style.display = matchesClient && matchesDate && matchesType ? '' : 'none';
    });
}

// Adicionar listeners para os campos de filtro
document.addEventListener('DOMContentLoaded', () => {
    const clientSearch = document.getElementById('clientSearch');
    const dateSearch = document.getElementById('dateSearch');
    const typeSearch = document.getElementById('typeSearch');
    const clearFilters = document.getElementById('clearFilters');
    
    // Adicionar eventos para cada campo de filtro
    clientSearch.addEventListener('input', filterTable);
    dateSearch.addEventListener('input', filterTable);
    typeSearch.addEventListener('change', filterTable);
    
    // Função para limpar filtros
    clearFilters.addEventListener('click', () => {
        clientSearch.value = '';
        dateSearch.value = '';
        typeSearch.value = '';
        filterTable();
    });
});

// Função para gerar relatório de clientes
function generateClientPDF() {
    // Cria uma nova instância do jsPDF
    const doc = new jspdf.jsPDF();
    
    // Adiciona o título do relatório
    doc.setFontSize(18);
    doc.text('Relatório de Clientes', 14, 20);
    
    // Adiciona a data do relatório
    doc.setFontSize(11);
    doc.text(`Data do relatório: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepara os dados da tabela
    const columns = ['Cliente', 'Email', 'Telefone', 'Data', 'Tipo', 'Plano', 'Valor'];
    const rows = [];
    
    // Pega apenas as linhas visíveis (não filtradas)
    Array.from(tableBody.getElementsByTagName('tr')).forEach(row => {
        if (row.style.display !== 'none') {
            rows.push([
                row.cells[0].textContent, // Cliente
                row.cells[1].textContent, // Email
                row.cells[2].textContent, // Telefone
                row.cells[3].textContent, // Data
                row.cells[4].textContent, // Tipo
                row.cells[5].textContent, // Plano
                row.cells[6].textContent  // Valor
            ]);
        }
    });
    
    // Gera a tabela no PDF
    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 40,
        styles: {
            fontSize: 9,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 66, 66]
        }
    });
    
    // Adiciona total de clientes e soma dos valores
    const totalClients = rows.length;
    const totalValue = rows.reduce((sum, row) => {
        return sum + parseFloat(row[6].replace('R$ ', '').replace(',', '.'));
    }, 0);
    
    const finalY = doc.previousAutoTable.finalY || 40;
    doc.text(`Total de Clientes: ${totalClients}`, 14, finalY + 10);
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2)}`, 14, finalY + 20);
    
    // Salva o PDF
    doc.save('relatorio-clientes.pdf');
}

// Modal de Despesas
const expenseModal = document.getElementById("expenseModal");
const openExpenseModalBtn = document.getElementById("openExpenseModal");
const closeExpenseModalBtn = document.querySelector(".close-expense");

openExpenseModalBtn.addEventListener("click", () => {
    expenseModal.style.display = "block";
});

closeExpenseModalBtn.addEventListener("click", () => {
    expenseModal.style.display = "none";
    clearEditState();
});

window.addEventListener("click", (event) => {
    if (event.target === expenseModal) {
        expenseModal.style.display = "none";
        clearEditState();
    }
});

// Função para salvar despesa na API
async function saveExpenseToAPI(data) {
    try {
        const response = await fetchWithAuth('http://localhost:3000/api/expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response) return;

        const expense = await response.json();
        await Promise.all([
            fetchExpenses(),
            calculateProfit(),
            displayTotals()
        ]);
        expenseModal.style.display = "none";
        expenseForm.reset();
    } catch (error) {
        console.error("Erro ao salvar despesa:", error);
        alert("Erro ao salvar despesa");
    }
}

// Função para adicionar linha à tabela de despesas
function addExpenseRowToTable(expense) {
    const row = document.createElement('tr');
    row.dataset.id = expense.id;

    row.innerHTML = `
        <td>${expense.expenseType}</td>
        <td>${expense.expenseDate}</td>
        <td>R$ ${parseFloat(expense.expenseValue).toFixed(2)}</td>
        <td class="expense-action-icons">
            <i class="fas fa-edit" onclick="editExpenseRow(this)"></i>
            <i class="fas fa-trash" onclick="deleteExpenseRow(this)"></i>
        </td>
    `;

    expenseTableBody.appendChild(row);
}

// Função para buscar todas as despesas
async function fetchExpenses() {
    try {
        const response = await fetchWithAuth('http://localhost:3000/api/expenses');
        if (!response) return;
        
        const expenses = await response.json();
        expenseTableBody.innerHTML = '';

        if (Array.isArray(expenses)) {
            expenses.forEach(expense => addExpenseRowToTable(expense));
        }
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
    }
}

// Função para deletar despesa
async function deleteExpenseRow(button) {
    const row = button.closest("tr");
    const expenseId = row.dataset.id;

    if (!expenseId) {
        console.error('ID da despesa não encontrado');
        return;
    }

    try {
        const response = await fetchWithAuth(`http://localhost:3000/api/expenses/${expenseId}`, {
            method: 'DELETE'
        });

        if (!response) return;

        if (response.ok) {
            row.remove();
            await Promise.all([
                calculateProfit(),
                displayTotals()
            ]);
        } else {
            throw new Error('Erro ao deletar despesa');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao deletar despesa');
    }
}

// Função para editar despesa
function editExpenseRow(button) {
    const row = button.closest("tr");
    const expenseId = row.dataset.id;
    const cells = row.querySelectorAll("td");

    // Configurar modo de edição
    isEditing = true;
    editingExpenseId = expenseId;

    // Preencher o modal
    document.getElementById("expenseType").value = cells[0].textContent;
    document.getElementById("expenseDate").value = cells[1].textContent;
    document.getElementById("expenseValue").value = cells[2].textContent.replace("R$ ", "");

    expenseModal.style.display = "block";
}

// Formulário de despesas
const expenseForm = document.getElementById("expenseForm");
let isEditing = false;
let editingExpenseId = null;

// Função para lidar com o submit do formulário de despesas
expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(expenseForm);
    const data = Object.fromEntries(formData.entries());

    try {
        if (isEditing && editingExpenseId) {
            const response = await fetchWithAuth(`http://localhost:3000/api/expenses/${editingExpenseId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            if (!response) return;

            if (response.ok) {
                await Promise.all([
                    fetchExpenses(),
                    calculateProfit(),
                    displayTotals()
                ]);
                expenseModal.style.display = "none";
                expenseForm.reset();
                isEditing = false;
                editingExpenseId = null;
            }
        } else {
            const response = await fetchWithAuth('http://localhost:3000/api/expenses');
            if (!response) return;

            const expenses = await response.json();
            const isDuplicate = expenses.some(expense =>
                expense.expenseType === data.expenseType &&
                expense.expenseDate === data.expenseDate &&
                expense.expenseValue === data.expenseValue
            );

            if (isDuplicate) {
                alert("Esta despesa já foi cadastrada!");
                return;
            }

            await saveExpenseToAPI(data);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao processar despesa');
    }
});

// Função para limpar o estado de edição
function clearEditState() {
    isEditing = false;
    editingExpenseId = null;
    expenseForm.reset();
}

// Função para filtrar a tabela de despesas
function filterExpenseTable() {
    const typeFilter = document.getElementById('expenseTypeSearch').value.toLowerCase();
    const dateFilter = document.getElementById('expenseDateSearch').value;
    
    const rows = expenseTableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const expenseType = row.cells[0].textContent.toLowerCase();
        const date = row.cells[1].textContent;
        
        const matchesType = expenseType.includes(typeFilter);
        const matchesDate = !dateFilter || date.includes(dateFilter);
        
        row.style.display = matchesType && matchesDate ? '' : 'none';
    });
}

// Adicionar listeners para os campos de filtro de despesas
document.addEventListener('DOMContentLoaded', () => {
    const expenseTypeSearch = document.getElementById('expenseTypeSearch');
    const expenseDateSearch = document.getElementById('expenseDateSearch');
    const clearExpenseFilters = document.getElementById('clearExpenseFilters');
    
    // Adicionar eventos para cada campo de filtro
    expenseTypeSearch.addEventListener('input', filterExpenseTable);
    expenseDateSearch.addEventListener('input', filterExpenseTable);
    
    // Função para limpar filtros
    clearExpenseFilters.addEventListener('click', () => {
        expenseTypeSearch.value = '';
        expenseDateSearch.value = '';
        filterExpenseTable();
    });
});

// Função para gerar relatório de despesas
function generateExpensePDF() {
    const doc = new jspdf.jsPDF();
    
    // Adiciona o título do relatório
    doc.setFontSize(18);
    doc.text('Relatório de Despesas', 14, 20);
    
    // Adiciona a data do relatório
    doc.setFontSize(11);
    doc.text(`Data do relatório: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepara os dados da tabela
    const columns = ['Tipo de Despesa', 'Data', 'Valor'];
    const rows = [];
    
    // Pega apenas as linhas visíveis (não filtradas)
    Array.from(expenseTableBody.getElementsByTagName('tr')).forEach(row => {
        if (row.style.display !== 'none') {
            rows.push([
                row.cells[0].textContent, // Tipo
                row.cells[1].textContent, // Data
                row.cells[2].textContent  // Valor
            ]);
        }
    });
    
    // Gera a tabela no PDF
    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 40,
        styles: {
            fontSize: 9,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 66, 66]
        }
    });
    
    // Adiciona total de despesas
    const totalExpenses = rows.reduce((sum, row) => {
        return sum + parseFloat(row[2].replace('R$ ', '').replace(',', '.'));
    }, 0);
    
    const finalY = doc.previousAutoTable.finalY || 40;
    doc.text(`Total de Despesas: R$ ${totalExpenses.toFixed(2)}`, 14, finalY + 10);
    
    // Salva o PDF
    doc.save('relatorio-despesas.pdf');
}