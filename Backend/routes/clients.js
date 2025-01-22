const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Listar todos os clientes
router.get('/', async (req, res) => {
    try {
        const clients = await db.query(
            'SELECT * FROM clients ORDER BY date DESC'
        );
        res.json(clients.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
});

// Adicionar novo cliente
router.post('/', async (req, res) => {
    try {
        const {
            clientName,
            email,
            phone,
            date,
            type,
            plan,
            value,
            hasSignal,
            signalValue
        } = req.body;

        const result = await db.query(
            `INSERT INTO clients 
            (clientName, email, phone, date, type, plan, value, hasSignal, signalValue) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [clientName, email, phone, date, type, plan, value, hasSignal, signalValue]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao criar cliente' });
    }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM clients WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        res.json({ message: 'Cliente deletado com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao deletar cliente' });
    }
});

module.exports = router;