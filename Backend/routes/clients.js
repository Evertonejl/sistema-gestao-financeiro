const express = require('express');
const router = express.Router();
const { db } = require('../db/db');

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

  console.log('Dados recebidos no backend:', req.body); // Log para debug

  if (!clientName || !email || !phone || !date || !type || !plan || !value) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const query = `
    INSERT INTO clients (
      clientName, 
      email, 
      phone, 
      date, 
      type, 
      plan, 
      value, 
      hasSignal, 
      signalValue
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query, 
    [
      clientName, 
      email, 
      phone, 
      date, 
      type, 
      plan, 
      value,
      hasSignal || 'nao',
      signalValue || '0'
    ], 
    function (err) {
      if (err) {
        console.error('Erro ao inserir cliente:', err);
        res.status(500).json({ error: err.message });
      } else {
        const newClient = {
          id: this.lastID,
          clientName,
          email,
          phone,
          date,
          type,
          plan,
          value,
          hasSignal: hasSignal || 'nao',
          signalValue: signalValue || '0'
        };
        console.log('Cliente criado:', newClient); // Log para debug
        res.status(201).json(newClient);
      }
    }
  );
});

// Atualizar um cliente existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
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

  console.log('Dados recebidos na atualização:', req.body);

  if (!clientName || !email || !phone || !date || !type || !plan || !value) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const query = `
      UPDATE clients 
      SET clientName = ?, 
          email = ?, 
          phone = ?, 
          date = ?, 
          type = ?, 
          plan = ?, 
          value = ?,
          hasSignal = ?,
          signalValue = ?
      WHERE id = ?
  `;

  try {
      // Converte os valores para números e garante formato correto
      const numericValue = parseFloat(value.toString().replace('R$', '').trim());
      const hasSignalValue = hasSignal || 'nao';
      const numericSignalValue = hasSignalValue === 'sim' ? 
          parseFloat(signalValue.toString().replace('R$', '').trim()) || 0 : 0;

      console.log('Valores processados:', {
          numericValue,
          hasSignalValue,
          numericSignalValue
      });

      db.run(query, [
          clientName,
          email,
          phone,
          date,
          type,
          plan,
          numericValue,
          hasSignalValue,
          numericSignalValue,
          id
      ], function(err) {
          if (err) {
              console.error('Erro ao atualizar cliente:', err);
              res.status(500).json({ error: err.message });
          } else if (this.changes === 0) {
              res.status(404).json({ error: "Cliente não encontrado." });
          } else {
              const updatedClient = {
                  id,
                  clientName,
                  email,
                  phone,
                  date,
                  type,
                  plan,
                  value: numericValue,
                  hasSignal: hasSignalValue,
                  signalValue: numericSignalValue
              };
              console.log('Cliente atualizado:', updatedClient);
              res.json(updatedClient);
          }
      });
  } catch (error) {
      console.error('Erro ao processar dados:', error);
      res.status(500).json({ error: error.message });
  }
});

// Deletar um cliente existente (mantém o mesmo)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM clients WHERE id = ?`;

  db.run(query, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Cliente não encontrado." });
    } else {
      res.status(204).send();
    }
  });
});

module.exports = router;