const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Listar todas as despesas
router.get('/', async (req, res) => {
    try {
        const expenses = await db.query(
            'SELECT * FROM expenses ORDER BY expenseDate DESC'
        );
        res.json(expenses.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar despesas' });
    }
});

// Adicionar nova despesa
router.post('/', async (req, res) => {
    try {
        const { expenseType, expenseDate, expenseValue } = req.body;

        const result = await db.query(
            'INSERT INTO expenses (expenseType, expenseDate, expenseValue) VALUES ($1, $2, $3) RETURNING *',
            [expenseType, expenseDate, expenseValue]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao criar despesa' });
    }
});

// Deletar despesa
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM expenses WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Despesa não encontrada' });
        }

        res.json({ message: 'Despesa deletada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao deletar despesa' });
    }
});

module.exports = router;