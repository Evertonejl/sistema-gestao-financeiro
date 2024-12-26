const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Importar rotas e middleware
const authMiddleware = require(path.join(__dirname, 'middleware', 'auth'));
const authRoutes = require(path.join(__dirname, 'routes', 'auth'));
const clientsRoutes = require(path.join(__dirname, 'routes', 'clients'));
const expensesRoutes = require(path.join(__dirname, 'routes', 'expenses'));

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});