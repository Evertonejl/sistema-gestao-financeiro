const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Funções para operações no banco
const db = {
  query: (text, params) => pool.query(text, params),
  
  get: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },
  
  all: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows;
  }
};

// Função para criar as tabelas
async function initializeTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        clientName TEXT,
        email TEXT,
        phone TEXT,
        date TEXT,
        type TEXT,
        plan TEXT,
        value DECIMAL,
        hasSignal TEXT DEFAULT 'nao',
        signalValue DECIMAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        expenseType TEXT,
        expenseDate TEXT,
        expenseValue DECIMAL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Tabelas criadas com sucesso');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
  }
}

// Inicializa as tabelas
initializeTables();

module.exports = { db, pool };