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

module.exports = router;

