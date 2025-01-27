const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
require('dotenv').config();

const { pool } = require('./db');

const authMiddleware = require(path.join(__dirname, 'middleware', 'auth'));
const authRoutes = require(path.join(__dirname, 'routes', 'auth'));
const clientsRoutes = require(path.join(__dirname, 'routes', 'clients'));
const expensesRoutes = require(path.join(__dirname, 'routes', 'expenses'));

// Configuração do CORS mais robusta
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de logging para debug
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware de conexão com banco aprimorado
app.use(async (req, res, next) => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        next();
    } catch (err) {
        console.error('Erro na conexão com o banco:', err);
        res.status(500).json({ 
            message: 'Erro de conexão com o banco de dados',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Middleware para verificar token em rotas protegidas
app.use('/api/clients', (req, res, next) => {
    console.log('Token recebido:', req.headers.authorization);
    next();
});

// Rotas API com prefix /api
app.use('/api/auth', authRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Rotas HTML - devem vir depois das rotas API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de erros mais detalhado
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Tratamento específico de erros
    switch (err.code) {
        case '23505':
            return res.status(409).json({ message: 'Registro duplicado' });
        case '23503':
            return res.status(400).json({ message: 'Referência inválida' });
        case 'ECONNREFUSED':
            return res.status(503).json({ message: 'Serviço temporariamente indisponível' });
        default:
            res.status(500).json({ 
                message: 'Erro interno do servidor',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
    }
});

// Inicialização do servidor com verificação de conexão
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
    console.log(`[${new Date().toISOString()}] Servidor rodando na porta ${PORT}`);
    
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Conectado ao PostgreSQL com sucesso:', result.rows[0].now);
        client.release();
    } catch (err) {
        console.error('Erro ao conectar ao PostgreSQL:', err);
        // Em produção, você pode querer encerrar o servidor se não conseguir conectar ao banco
        if (process.env.NODE_ENV === 'production') {
            console.error('Encerrando servidor devido a erro de conexão com banco');
            server.close();
            process.exit(1);
        }
    }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (process.env.NODE_ENV === 'production') {
        console.error('Encerrando servidor devido a erro não tratado');
        server.close(() => process.exit(1));
    }
});