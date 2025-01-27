const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Middleware de log
router.use((req, res, next) => {
    console.log(`[Expenses] ${req.method} ${req.path} - Token:`, req.headers.authorization?.substring(0, 20) + '...');
    next();
});

// Listar todas as despesas
router.get('/', async (req, res) => {
    try {
        console.log('[Expenses] Buscando todas as despesas');
        const expenses = await db.query(
            'SELECT * FROM expenses ORDER BY expenseDate DESC'
        );
        console.log(`[Expenses] ${expenses.rows.length} despesas encontradas`);
        res.json(expenses.rows);
    } catch (err) {
        console.error('[Expenses] Erro ao buscar despesas:', err);
        res.status(500).json({ 
            message: 'Erro ao buscar despesas',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Adicionar nova despesa
router.post('/', async (req, res) => {
    try {
        console.log('[Expenses] Tentando criar nova despesa:', req.body);
        const { expenseType, expenseDate, expenseValue } = req.body;

        const result = await db.query(
            'INSERT INTO expenses (expenseType, expenseDate, expenseValue) VALUES ($1, $2, $3) RETURNING *',
            [expenseType, expenseDate, expenseValue]
        );

        console.log('[Expenses] Despesa criada com sucesso:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[Expenses] Erro ao criar despesa:', err);
        res.status(500).json({ message: 'Erro ao criar despesa' });
    }
});

module.exports = router;