const express = require('express');
const router = express.Router();
const { db } = require('../db/db'); // Conexão com o banco de dados

// Listar todos os clientes
router.get('/', (req, res) => {
  db.all('SELECT * FROM clients', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Criar um novo cliente
router.post('/', (req, res) => {
  const { clientName, email, phone, date, type, plan, value } = req.body;

  if (!clientName || !email || !phone || !date || !type || !plan || !value) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const query = `INSERT INTO clients (clientName, email, phone, date, type, plan, value) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [clientName, email, phone, date, type, plan, value], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID, clientName, email, phone, date, type, plan, value });
    }
  });
});

// Atualizar um cliente existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { clientName, email, phone, date, type, plan, value } = req.body;

  if (!clientName || !email || !phone || !date || !type || !plan || !value) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const query = `UPDATE clients SET clientName = ?, email = ?, phone = ?, date = ?, type = ?, plan = ?, value = ? WHERE id = ?`;

  db.run(query, [clientName, email, phone, date, type, plan, value, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Cliente não encontrado." });
    } else {
      res.json({ id, clientName, email, phone, date, type, plan, value });
    }
  });
});

// Deletar um cliente existente
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM clients WHERE id = ?`;

  db.run(query, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Cliente não encontrado." });
    } else {
      res.status(204).send(); // Sem conteúdo
    }
  });
});

module.exports = router;