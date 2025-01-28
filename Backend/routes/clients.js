const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Middleware de log
router.use((req, res, next) => {
    console.log(`[Clients] ${req.method} ${req.path} - Token:`, req.headers.authorization?.substring(0, 20) + '...');
    next();
});

// Listar todos os clientes
router.get('/', async (req, res) => {
    try {
        console.log('[Clients] Buscando todos os clientes');
        const clients = await db.query(
            'SELECT * FROM clients ORDER BY date DESC'
        );
        console.log(`[Clients] ${clients.rows.length} clientes encontrados`);
        res.json(clients.rows);
    } catch (err) {
        console.error('[Clients] Erro ao buscar clientes:', err);
        res.status(500).json({ 
            message: 'Erro ao buscar clientes',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Adicionar novo cliente
router.post('/', async (req, res) => {
    try {
        console.log('[Clients] Tentando criar novo cliente:', req.body);
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

        console.log('[Clients] Cliente criado com sucesso:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[Clients] Erro ao criar cliente:', err);
        res.status(500).json({ message: 'Erro ao criar cliente' });
    }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
    try {
        console.log('[Clients] Tentando deletar cliente:', req.params.id);
        const result = await db.query(
            'DELETE FROM clients WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        console.log('[Clients] Cliente deletado com sucesso');
        res.json({ message: 'Cliente deletado com sucesso' });
    } catch (err) {
        console.error('[Clients] Erro ao deletar cliente:', err);
        res.status(500).json({ message: 'Erro ao deletar cliente' });
    }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
    try {
        console.log('[Clients] Tentando atualizar cliente:', req.params.id);
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
            `UPDATE clients 
            SET clientName = $1, email = $2, phone = $3, date = $4, 
                type = $5, plan = $6, value = $7, hasSignal = $8, signalValue = $9
            WHERE id = $10
            RETURNING *`,
            [clientName, email, phone, date, type, plan, value, hasSignal, signalValue, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        console.log('[Clients] Cliente atualizado com sucesso:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Clients] Erro ao atualizar cliente:', err);
        res.status(500).json({ message: 'Erro ao atualizar cliente' });
    }
});

module.exports = router;