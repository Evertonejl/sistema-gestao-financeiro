const express = require('express');
const router = express.Router();
const { db } = require('../db/db'); // Conexão com o banco de dados

// Listar todas as despesas
router.get('/', (req, res) => {
  db.all('SELECT * FROM expenses', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Criar uma nova despesa
router.post('/', (req, res) => {
  const { expenseType, expenseDate, expenseValue } = req.body;

  if (!expenseType || !expenseDate || !expenseValue) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const sql = `INSERT INTO expenses (expenseType, expenseDate, expenseValue) VALUES (?, ?, ?)`;
  const params = [expenseType, expenseDate, expenseValue];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Erro ao inserir a despesa no banco de dados." });
    }
    res.status(201).json({ id: this.lastID, expenseType, expenseDate, expenseValue });
  });
});

// Atualizar uma despesa existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { expenseType, expenseDate, expenseValue } = req.body;

  if (!expenseType || !expenseDate || !expenseValue) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const sql = `UPDATE expenses SET expenseType = ?, expenseDate = ?, expenseValue = ? WHERE id = ?`;
  const params = [expenseType, expenseDate, expenseValue, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Erro ao atualizar a despesa no banco de dados." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Despesa não encontrada." });
    }
    res.json({ id, expenseType, expenseDate, expenseValue });
  });
});

// Deletar uma despesa existente
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM expenses WHERE id = ?`;

  db.run(sql, id, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Erro ao deletar a despesa no banco de dados." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Despesa não encontrada." });
    }
    res.status(204).send(); // Sem conteúdo
  });
});

module.exports = router;