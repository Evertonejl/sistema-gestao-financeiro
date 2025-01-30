const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuração básica do CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de log básico
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
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

// Rota básica de verificação
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Rotas de páginas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Handler para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
});

// Handler de erros básico
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});