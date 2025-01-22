const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
require('dotenv').config(); // Adicionar para carregar variáveis de ambiente

// Importar conexão do banco
const { pool } = require('./db'); // Importar o pool do novo arquivo db.js

// Importar rotas e middleware
const authMiddleware = require(path.join(__dirname, 'middleware', 'auth'));
const authRoutes = require(path.join(__dirname, 'routes', 'auth'));
const clientsRoutes = require(path.join(__dirname, 'routes', 'clients'));
const expensesRoutes = require(path.join(__dirname, 'routes', 'expenses'));

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware para verificar conexão com banco
app.use(async (req, res, next) => {
    try {
        await pool.query('SELECT 1');
        next();
    } catch (err) {
        console.error('Erro na conexão com o banco:', err);
        res.status(500).json({ message: 'Erro de conexão com o banco de dados' });
    }
});

// Rotas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);

// Tratamento de erros melhorado
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.code === '23505') { // Erro de unique constraint do PostgreSQL
        return res.status(409).json({ message: 'Registro duplicado' });
    }
    
    if (err.code === '23503') { // Erro de foreign key
        return res.status(400).json({ message: 'Referência inválida' });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    
    // Verificar conexão com o banco ao iniciar
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('Erro ao conectar ao PostgreSQL:', err);
        } else {
            console.log('Conectado ao PostgreSQL com sucesso');
        }
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('Pool de conexão fechado');
        process.exit(0);
    } catch (err) {
        console.error('Erro ao fechar pool:', err);
        process.exit(1);
    }
});

// Rota de teste no server.js para debug
app.get('/api/test-auth', authMiddleware, (req, res) => {
    res.json({
        message: 'Autenticação bem sucedida',
        userId: req.userId
    });
});