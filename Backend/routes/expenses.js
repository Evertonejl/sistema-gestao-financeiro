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

// Deletar despesa
router.delete('/:id', async (req, res) => {
   try {
       console.log('[Expenses] Tentando deletar despesa:', req.params.id);
       const result = await db.query(
           'DELETE FROM expenses WHERE id = $1 RETURNING *',
           [req.params.id]
       );

       if (result.rowCount === 0) {
           return res.status(404).json({ message: 'Despesa não encontrada' });
       }

       console.log('[Expenses] Despesa deletada com sucesso');
       res.json({ message: 'Despesa deletada com sucesso' });
   } catch (err) {
       console.error('[Expenses] Erro ao deletar despesa:', err);
       res.status(500).json({ message: 'Erro ao deletar despesa' });
   }
});

// Atualizar despesa
router.put('/:id', async (req, res) => {
   try {
       console.log('[Expenses] Tentando atualizar despesa:', req.params.id);
       const { expenseType, expenseDate, expenseValue } = req.body;

       const result = await db.query(
           `UPDATE expenses 
           SET expenseType = $1, expenseDate = $2, expenseValue = $3
           WHERE id = $4
           RETURNING *`,
           [expenseType, expenseDate, expenseValue, req.params.id]
       );

       if (result.rowCount === 0) {
           return res.status(404).json({ message: 'Despesa não encontrada' });
       }

       console.log('[Expenses] Despesa atualizada com sucesso:', result.rows[0]);
       res.json(result.rows[0]);
   } catch (err) {
       console.error('[Expenses] Erro ao atualizar despesa:', err);
       res.status(500).json({ message: 'Erro ao atualizar despesa' });
   }
});

// Buscar despesa por ID
router.get('/:id', async (req, res) => {
   try {
       console.log('[Expenses] Buscando despesa por ID:', req.params.id);
       const result = await db.query(
           'SELECT * FROM expenses WHERE id = $1',
           [req.params.id]
       );

       if (result.rowCount === 0) {
           return res.status(404).json({ message: 'Despesa não encontrada' });
       }

       console.log('[Expenses] Despesa encontrada:', result.rows[0]);
       res.json(result.rows[0]);
   } catch (err) {
       console.error('[Expenses] Erro ao buscar despesa:', err);
       res.status(500).json({ message: 'Erro ao buscar despesa' });
   }
});

module.exports = router;