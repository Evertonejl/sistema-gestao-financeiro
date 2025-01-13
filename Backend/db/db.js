const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Caminho absoluto para o banco de dados
const dbDir = path.join(__dirname, 'db');

// Verifica se o diretório 'db' existe, caso contrário, cria-o
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Caminho completo do arquivo de banco de dados
const dbPath = path.resolve(__dirname, 'mydatabase.db');

// Criar ou abrir o banco de dados SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado com sucesso.');
  }
});

// Criar as tabelas "clients" e "expenses" se não existirem
db.serialize(() => {
  // Tabela de clientes com os novos campos hasSignal e signalValue
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT,
      email TEXT,
      phone TEXT,
      date TEXT,
      type TEXT,
      plan TEXT,
      value REAL,
      hasSignal TEXT DEFAULT 'nao',
      signalValue REAL DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar/verificar tabela clients:', err);
    } else {
      // Verifica se as colunas hasSignal e signalValue existem
      db.get("PRAGMA table_info(clients)", [], (err, row) => {
        if (err) {
          console.error('Erro ao verificar colunas:', err);
        } else {
          // Se as colunas não existirem, adiciona-as
          db.run("ALTER TABLE clients ADD COLUMN hasSignal TEXT DEFAULT 'nao'", (err) => {
            if (err && !err.message.includes('duplicate')) {
              console.error('Erro ao adicionar coluna hasSignal:', err);
            }
          });
          db.run("ALTER TABLE clients ADD COLUMN signalValue REAL DEFAULT 0", (err) => {
            if (err && !err.message.includes('duplicate')) {
              console.error('Erro ao adicionar coluna signalValue:', err);
            }
          });
        }
      });
    }
  });

  // Tabela de despesas
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expenseType TEXT,
      expenseDate TEXT,
      expenseValue REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela users:', err);
    } else {
      console.log('Tabela users verificada/criada com sucesso');
    }
  });
});

// Função para fechar a conexão com o banco de dados
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar o banco de dados:', err.message);
    } else {
      console.log('Banco de dados fechado com sucesso.');
    }
  });
}

// Funções assíncronas para operações no banco de dados
const dbAsync = {
  get: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  },
  
  all: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  
  run: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
};

module.exports = { db, closeDb, ...dbAsync };