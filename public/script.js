// Adicione no início do seu script
(function checkInitialAuth() {
    const token = getAuthToken();
    console.log('Token inicial:', {
        exists: !!token,
        value: token ? token.substring(0, 20) + '...' : 'none'
    });
})();


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
    try {
        const token = getAuthToken();
        console.log('Token encontrado:', token ? 'Sim' : 'Não');
        console.log('Token valor:', token?.substring(0, 20) + '...'); // Mostra parte do token por segurança

        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Construa a URL corretamente - AQUI ESTÁ A PRINCIPAL MUDANÇA
        const baseURL = 'https://sistema-gestao-financeiro-production.up.railway.app/api';
        const cleanUrl = url.replace(/^\/+|\/+$/g, '').replace(/^api\//, '');
        const fullUrl = `${baseURL}/${cleanUrl}`;
        
        console.log('Requisição para:', fullUrl);

        const requestOptions = {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(fullUrl, requestOptions);

        // Log da resposta para debug
        console.log('Resposta recebida:', {
            url: fullUrl,
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });

        if (response.status === 401) {
            clearAuthData();
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// Funções auxiliares
function clearAuthData() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    sessionStorage.removeItem('userName');
}

function redirectToLogin() {
    window.location.href = '/login.html';
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

 // Função para obter a quantidade de clientes cadastrados por mês
 async function getClientsPerMonth() {
    try {
        const clients = await fetchWithAuth('clients');
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
        const expenses = await fetchWithAuth('expenses');
        const months = Array(12).fill(0);
        
        expenses.forEach(expense => {
            const date = new Date(expense.expenseDate);
            if (!isNaN(date)) {
                const monthIndex = date.getMonth();
                const value = parseFloat(expense.expenseValue) || 0;
                months[monthIndex] += value;
            }
        });
        return months.slice(0, 6);
    } catch (error) {
        console.error('Erro ao obter dados das despesas:', error);
        return Array(6).fill(0);
    }
}

async function testAPIConnections() {
    try {
        console.log('=== Iniciando testes de API ===');
        
        const token = getAuthToken();
        console.log('Token atual:', token ? 'Presente' : 'Ausente');

        // Teste de conexão básica
        const testResponse = await fetch('https://sistema-gestao-financeiro-production.up.railway.app/api/health');
        console.log('Teste de conexão:', testResponse.ok ? 'Sucesso' : 'Falha');

        // Teste clientes
        console.log('Testando API de clientes...');
        const clientsResponse = await fetchWithAuth('clients');
        console.log('Resposta clientes:', clientsResponse);

        // Teste despesas
        console.log('Testando API de despesas...');
        const expensesResponse = await fetchWithAuth('expenses');
        console.log('Resposta despesas:', expensesResponse);

        console.log('=== Testes concluídos ===');
    } catch (error) {
        console.error('Erro nos testes:', error);
    }
}


// Adicione a verificação quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {

   
    if (!checkAuth()) return;
    console.log('Iniciando testes de conexão...');
    testAPIConnections()
    
    updateUserHeader();
   
    // Configuração do campo de sinal
    const dataForm = document.getElementById('dataForm');
    const hasSignalSelect = document.getElementById('hasSignal');
    const signalValueGroup = document.getElementById('signalValueGroup');
    
    console.log('Elementos encontrados:', {
        dataForm: dataForm !== null,
        hasSignalSelect: hasSignalSelect !== null,
        signalValueGroup: signalValueGroup !== null
    });

    // 2. Event listener para o select de sinal
    if (hasSignalSelect && signalValueGroup) {
        hasSignalSelect.addEventListener('change', function() {
            console.log('Seleção de sinal alterada para:', this.value);
            signalValueGroup.style.display = this.value === 'sim' ? 'block' : 'none';
            if (this.value === 'nao') {
                document.getElementById('signalValue').value = '';
            }
        });
    }

    // 3. Event listener do formulário
    if (dataForm) {
        dataForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log('Formulário submetido');
            
            try {
                const formData = new FormData(dataForm);
                const data = Object.fromEntries(formData.entries());
                
                // Log de todos os campos do formulário
                console.log('Dados do formulário:', {
                    ...data,
                    hasSignal: hasSignalSelect?.value,
                    signalValue: document.getElementById('signalValue')?.value
                });

                // Explicitamente pega os valores dos campos
                data.hasSignal = hasSignalSelect.value;
                data.signalValue = document.getElementById('signalValue').value;

                console.log('Dados após processamento:', data);

                // Verifica se tem sinal
                if (data.hasSignal === 'sim' && (!data.signalValue || parseFloat(data.signalValue) <= 0)) {
                    console.log('Validação do sinal falhou');
                    alert('Por favor, informe o valor do sinal');
                    return;
                }

                await saveClientToAPI(data);
            } catch (error) {
                console.error('Erro ao processar formulário:', error);
                alert('Erro ao processar formulário');
            }
        });
    }

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
        const [clients, expenses] = await Promise.all([
            fetchWithAuth('clients'),
            fetchWithAuth('expenses')
        ]);
 
        // Calcula o total de receitas
        const totalRevenue = clients.reduce((acc, client) => {
            const mainValue = parseFloat(client.value) || 0;
            return acc + mainValue;
        }, 0);
 
        // Calcula total de despesas
        const totalExpenses = expenses.reduce((acc, expense) => {
            const value = parseFloat(expense.expenseValue) || 0;
            return acc + value;
        }, 0);
 
        const profit = totalRevenue - totalExpenses;
 
        // Atualiza elementos na UI
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
            elements.profit.textContent = `Lucro R$ ${profit.toFixed(2)}`;
            elements.profit.className = profit >= 0 ? 'positive' : 'negative';
        }
 
        return { totalRevenue, totalExpenses, profit };
    } catch (error) {
        console.error('Erro ao calcular totais:', error);
        return { totalRevenue: 0, totalExpenses: 0, profit: 0 };
    }
}
// Função para calcular lucro
async function calculateProfit() {
    try {
        const clients = await fetchWithAuth('clients');
        const expenses = await fetchWithAuth('expenses');

        // Calcula o total de receitas
        const totalRevenue = clients.reduce((acc, client) => {
            const mainValue = parseFloat(client.value) || 0;
            return acc + mainValue;
        }, 0);

        // Calcula total de despesas
        const totalExpenses = expenses.reduce((acc, expense) => {
            const value = parseFloat(expense.expenseValue) || 0;
            return acc + value;
        }, 0);

        // Calcula o lucro
        const profit = totalRevenue - totalExpenses;

        // Atualiza o elemento do lucro na UI
        const profitElement = document.getElementById("profit");
        if (profitElement) {
            profitElement.textContent = `Lucro R$ ${profit.toFixed(2)}`;
            profitElement.className = profit >= 0 ? 'positive' : 'negative';

            // Adiciona uma cor de fundo suave baseada no lucro
            profitElement.style.backgroundColor = profit >= 0 ? 
                'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
        }

        // Log para debug
        console.log('Cálculo de lucro:', {
            totalRevenue,
            totalExpenses,
            profit
        });

        return profit;
    } catch (error) {
        console.error('Erro ao calcular lucro:', {
            error: error.message,
            stack: error.stack
        });
        alert('Erro ao calcular lucro. Por favor, tente novamente.');
        return 0;
    }
}
// Função para buscar clientes
async function fetchClients() {
    try {
        console.log('Buscando clientes...');
        const clients = await fetchWithAuth('clients');
        
        if (Array.isArray(clients)) {
            tableBody.innerHTML = '';
            clients.forEach(client => addRowToTable(client));
            if (document.getElementById('clientCount')) {
                document.getElementById('clientCount').textContent = `Total de clientes: ${clients.length}`;
            }
        } else {
            console.error('Resposta não é um array:', clients);
        }
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
    }
}

// Função para adicionar linha à tabela de clientes
function addRowToTable(client) {
    console.log('Adicionando cliente à tabela:', client);
    
    const existingRow = Array.from(tableBody.rows).find(row =>
        row.cells[0].textContent === client.clientName &&
        row.cells[1].textContent === client.email &&
        row.cells[2].textContent === client.phone
    );
    
    if (existingRow) {
        console.log('Cliente já existe na tabela');
        return;
    }

    const row = document.createElement('tr');
    row.dataset.id = client.id;

    // Garante que o signalValue seja tratado corretamente
    const hasSignal = client.hasSignal === 'sim';
    const signalDisplay = hasSignal 
        ? `Sinal: R$ ${parseFloat(client.signalValue || 0).toFixed(2)}`
        : 'Sem sinal';

    row.innerHTML = `
        <td>${client.clientName}</td>
        <td>${client.email}</td>
        <td>${client.phone}</td>
        <td>${client.date}</td>
        <td>${client.type}</td>
        <td>${client.plan}</td>
        <td>R$ ${parseFloat(client.value).toFixed(2)}</td>
        <td>${signalDisplay}</td>
        <td class="action-icons">
            <i class="fas fa-edit" onclick="window.editRow(this)"></i>
            <i class="fas fa-trash" onclick="window.deleteRow(this)"></i>
        </td>
    `;
    
    tableBody.appendChild(row);
    console.log('Linha adicionada com sucesso');
}
// Função para deletar cliente
async function deleteRow(button) {
    try {
        const row = button.closest("tr");
        const clientId = row.dataset.id;

        if (!clientId) {
            console.error('ID do cliente não encontrado');
            return;
        }

        await fetchWithAuth(`clients/${clientId}`, {
            method: 'DELETE'
        });

        row.remove();
        await Promise.all([
            fetchClients(),
            displayTotals(),
            calculateProfit()
        ]);
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        alert('Erro ao deletar cliente');
    }
}




// Função global para editar
window.editRow = async function(button) {
    const row = button.closest("tr");
    const clientId = row.dataset.id;
    const cells = row.querySelectorAll("td");
 
    console.log('Iniciando edição do cliente ID:', clientId);
 
    // Preenche o formulário com os dados atuais
    document.getElementById("clientName").value = cells[0].textContent;
    document.getElementById("email").value = cells[1].textContent;
    document.getElementById("phone").value = cells[2].textContent;
    document.getElementById("date").value = cells[3].textContent;
    document.getElementById("type").value = cells[4].textContent;
    document.getElementById("plan").value = cells[5].textContent;
    document.getElementById("value").value = cells[6].textContent.replace(/[R$\s]/g, "");
    
    // Configuração do sinal
    const signalInfo = cells[7].textContent;
    const hasSignalSelect = document.getElementById("hasSignal");
    const signalValueGroup = document.getElementById("signalValueGroup");
    
    if (signalInfo.includes('Sinal:')) {
        hasSignalSelect.value = 'sim';
        signalValueGroup.style.display = 'block';
        const match = signalInfo.match(/R\$\s*([\d.,]+)/);
        const signalValue = match ? match[1].replace(',', '.') : '0';
        document.getElementById("signalValue").value = signalValue;
    } else {
        hasSignalSelect.value = 'nao';
        signalValueGroup.style.display = 'none';
        document.getElementById("signalValue").value = '0';
    }
 
    const modal = document.getElementById("modal");
    modal.style.display = "block";
 
    // Função para lidar com a submissão do formulário de edição
    const dataForm = document.getElementById("dataForm");
    dataForm.onsubmit = async (e) => {
        e.preventDefault();
 
        try {
            const formData = new FormData(dataForm);
            const data = Object.fromEntries(formData.entries());
            
            // Prepara os dados para envio
            const updatedData = {
                ...data,
                hasSignal: hasSignalSelect.value,
                signalValue: hasSignalSelect.value === 'sim' ? 
                    document.getElementById("signalValue").value : '0',
                value: data.value.toString().replace(',', '.')
            };
 
            console.log('Dados para atualização:', updatedData);
 
            await fetchWithAuth(`clients/${clientId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });
 
            // Fecha o modal e limpa o formulário
            modal.style.display = "none";
            dataForm.reset();
 
            // Atualiza os dados
            await Promise.all([
                fetchClients(),
                displayTotals(),
                calculateProfit()
            ]);
 
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            alert('Erro ao atualizar cliente');
        }
    };
 };







// Salvar cliente na API
async function saveClientToAPI(data) {
    try {
        console.log('Iniciando salvamento do cliente:', data);

        const preparedData = {
            ...data,
            value: parseFloat(data.value).toFixed(2),
            hasSignal: data.hasSignal,
            signalValue: data.hasSignal === 'sim' ? parseFloat(data.signalValue).toFixed(2) : '0'
        };

        await fetchWithAuth('clients', {
            method: 'POST',
            body: JSON.stringify(preparedData)
        });

        // Atualiza os dados
        await Promise.all([
            fetchClients(),
            displayTotals(),
            calculateProfit()
        ]);

        // Limpa o formulário e fecha o modal
        const modal = document.getElementById("modal");
        const dataForm = document.getElementById("dataForm");
        if (modal) modal.style.display = "none";
        if (dataForm) dataForm.reset();

    } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        alert("Erro ao salvar cliente");
    }
}

async function saveExpenseToAPI(data) {
    try {
        if (!data.expenseValue || parseFloat(data.expenseValue) <= 0) {
            alert('Por favor, informe um valor válido para a despesa');
            return;
        }

        const preparedData = {
            ...data,
            expenseValue: parseFloat(data.expenseValue).toFixed(2)
        };

        await fetchWithAuth('expenses', {
            method: 'POST',
            body: JSON.stringify(preparedData)
        });

        // Atualiza os dados
        await Promise.all([
            fetchExpenses(),
            calculateProfit(),
            displayTotals()
        ]);

        // Limpa o formulário e fecha o modal
        if (expenseModal) expenseModal.style.display = "none";
        if (expenseForm) expenseForm.reset();

    } catch (error) {
        console.error("Erro ao salvar despesa:", error);
        alert("Erro ao salvar despesa");
    }
}


// Função para filtrar a tabela
function filterTable() {
    const clientFilter = document.getElementById('clientSearch').value.toLowerCase();
    const dateFilter = document.getElementById('dateSearch').value;
    const typeFilter = document.getElementById('typeSearch').value;
    // Corrigindo para usar signalFilter em vez de paymentFilter
    const signalFilter = document.getElementById('signalFilter')?.value;
    
    const rows = tableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const clientName = row.cells[0].textContent.toLowerCase();
        const date = row.cells[3].textContent;
        const type = row.cells[4].textContent;
        const signal = row.cells[7].textContent.toLowerCase();
        
        const matchesClient = clientName.includes(clientFilter);
        const matchesDate = !dateFilter || date.includes(dateFilter);
        const matchesType = !typeFilter || type === typeFilter;
        const matchesSignal = !signalFilter || 
            (signalFilter === 'sim' && signal.includes('sinal: r$')) ||
            (signalFilter === 'nao' && signal === 'sem sinal');
        
        row.style.display = matchesClient && matchesDate && matchesType && matchesSignal ? '' : 'none';
    });
}

// Adicionar listeners para os campos de filtro
document.addEventListener('DOMContentLoaded', () => {
    const clientSearch = document.getElementById('clientSearch');
    const dateSearch = document.getElementById('dateSearch');
    const typeSearch = document.getElementById('typeSearch');
    const signalFilter = document.getElementById('signalFilter');
    const clearFilters = document.getElementById('clearFilters');

    // Adicionar eventos para cada campo de filtro
    if (clientSearch) {
        clientSearch.addEventListener('input', filterTable);
    }
    if (dateSearch) {
        dateSearch.addEventListener('input', filterTable);
    }
    if (typeSearch) {
        typeSearch.addEventListener('change', filterTable);
    }
    if (signalFilter) {
        signalFilter.addEventListener('change', filterTable);
    }
    
    // Função para limpar filtros
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            if (clientSearch) clientSearch.value = '';
            if (dateSearch) dateSearch.value = '';
            if (typeSearch) typeSearch.value = '';
            if (signalFilter) signalFilter.value = '';
            filterTable();
        });
    }
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
        const response = await fetchWithAuth('expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });

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
        console.log('Buscando despesas...');
        const expenses = await fetchWithAuth('expenses');
        
        if (Array.isArray(expenses)) {
            expenseTableBody.innerHTML = '';
            expenses.forEach(expense => addExpenseRowToTable(expense));
        } else {
            console.error('Resposta não é um array:', expenses);
        }
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
    }
}

// Função para deletar despesa
async function deleteExpenseRow(button) {
    try {
        const row = button.closest("tr");
        const expenseId = row.dataset.id;

        if (!expenseId) {
            console.error('ID da despesa não encontrado');
            return;
        }

        await fetchWithAuth(`expenses/${expenseId}`, {
            method: 'DELETE'
        });

        row.remove();
        await Promise.all([
            fetchExpenses(),
            calculateProfit(),
            displayTotals()
        ]);
    } catch (error) {
        console.error('Erro ao deletar despesa:', error);
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
            await fetchWithAuth(`expenses/${editingExpenseId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
 
            await Promise.all([
                fetchExpenses(),
                calculateProfit(),
                displayTotals()
            ]);
            expenseModal.style.display = "none";
            expenseForm.reset();
            isEditing = false;
            editingExpenseId = null;
        } else {
            // Verificar duplicatas
            const expenses = await fetchWithAuth('expenses');
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

// Função para gerar relatório combinado
async function generateCombinedReport() {
    const doc = new jspdf.jsPDF();
    
    // Adiciona título do relatório
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 14, 20);
    
    // Adiciona a data do relatório
    doc.setFontSize(11);
    doc.text(`Data do relatório: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Seção de Clientes
    doc.setFontSize(14);
    doc.text('Clientes', 14, 45);
    
    // Prepara os dados dos clientes
    const clientColumns = ['Cliente', 'Data', 'Plano', 'Valor', 'Sinal'];
    const clientRows = [];
    
    Array.from(tableBody.getElementsByTagName('tr')).forEach(row => {
        if (row.style.display !== 'none') {
            clientRows.push([
                row.cells[0].textContent, // Cliente
                row.cells[3].textContent, // Data
                row.cells[5].textContent, // Plano
                row.cells[6].textContent, // Valor
                row.cells[7].textContent  // Sinal
            ]);
        }
    });
    
    // Gera a tabela de clientes
    doc.autoTable({
        head: [clientColumns],
        body: clientRows,
        startY: 50,
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 66, 66]
        }
    });
    
    // Calcula totais dos clientes
    const clientTotal = clientRows.reduce((sum, row) => {
        const value = parseFloat(row[3].replace('R$ ', '').replace(',', '.'));
        return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    const finalYClients = doc.previousAutoTable.finalY;
    doc.text(`Total de Clientes: ${clientRows.length}`, 14, finalYClients + 10);
    doc.text(`Valor Total de Serviços: R$ ${clientTotal.toFixed(2)}`, 14, finalYClients + 20);
    
    // Seção de Despesas
    doc.setFontSize(14);
    doc.text('Despesas', 14, finalYClients + 35);
    
    // Prepara os dados das despesas
    const expenseColumns = ['Tipo de Despesa', 'Data', 'Valor'];
    const expenseRows = [];
    
    Array.from(expenseTableBody.getElementsByTagName('tr')).forEach(row => {
        if (row.style.display !== 'none') {
            expenseRows.push([
                row.cells[0].textContent, // Tipo
                row.cells[1].textContent, // Data
                row.cells[2].textContent  // Valor
            ]);
        }
    });
    
    // Gera a tabela de despesas
    doc.autoTable({
        head: [expenseColumns],
        body: expenseRows,
        startY: finalYClients + 40,
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [66, 66, 66]
        }
    });
    
    // Calcula total de despesas
    const expenseTotal = expenseRows.reduce((sum, row) => {
        const value = parseFloat(row[2].replace('R$ ', '').replace(',', '.'));
        return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    const finalYExpenses = doc.previousAutoTable.finalY;
    doc.text(`Total de Despesas: R$ ${expenseTotal.toFixed(2)}`, 14, finalYExpenses + 10);
    
    // Resumo Financeiro
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 14, finalYExpenses + 25);
    
    const profit = clientTotal - expenseTotal;
    
    doc.setFontSize(11);
    doc.text(`Total de Entradas: R$ ${clientTotal.toFixed(2)}`, 14, finalYExpenses + 35);
    doc.text(`Total de Saídas: R$ ${expenseTotal.toFixed(2)}`, 14, finalYExpenses + 45);
    doc.text(`Lucro: R$ ${profit.toFixed(2)}`, 14, finalYExpenses + 55);
    
    // Salva o PDF
    doc.save('relatorio-financeiro.pdf');
}

// Adicione um botão HTML para chamar a função
const buttonHtml = `
    <button onclick="generateCombinedReport()" class="btn btn-primary">
        <i class="fas fa-file-pdf"></i> Gerar Relatório Completo
    </button>
`;