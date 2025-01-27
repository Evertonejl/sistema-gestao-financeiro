const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuração do CORS
app.use(cors({
    origin: '*', // Depois você pode restringir para seu domínio específico
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de log
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    next();
});

// Importação das rotas
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const expensesRoutes = require('./routes/expenses');
const authMiddleware = require('./middleware/auth');

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);

// Rotas estáticas
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handler para rotas não encontradas
app.use((req, res) => {
    console.log(`Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ message: 'Rota não encontrada' });
});

// Handler de erros
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});