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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de conexão com banco
app.use(async (req, res, next) => {
    try {
        await pool.query('SELECT 1');
        next();
    } catch (err) {
        console.error('Erro na conexão com o banco:', err);
        res.status(500).json({ message: 'Erro de conexão com o banco de dados' });
    }
});

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);

// Rotas HTML - devem vir depois das rotas API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.code === '23505') return res.status(409).json({ message: 'Registro duplicado' });
    if (err.code === '23503') return res.status(400).json({ message: 'Referência inválida' });
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    pool.query('SELECT NOW()', (err, res) => {
        if (err) console.error('Erro ao conectar ao PostgreSQL:', err);
        else console.log('Conectado ao PostgreSQL com sucesso');
    });
});