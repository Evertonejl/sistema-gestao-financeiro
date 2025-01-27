const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões com monitoramento
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para Railway
    },
    max: 20, // máximo de conexões
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Monitoramento de conexões
pool.on('connect', () => {
    console.log('[Database] Nova conexão estabelecida com o PostgreSQL');
});

pool.on('error', (err) => {
    console.error('[Database] Erro inesperado no PostgreSQL:', err);
});

// Funções melhoradas para operações no banco
const db = {
    query: async (text, params) => {
        const start = Date.now();
        try {
            const result = await pool.query(text, params);
            const duration = Date.now() - start;
            console.log('[Database] Query executada:', {
                text,
                duration,
                rows: result.rowCount
            });
            return result;
        } catch (error) {
            console.error('[Database] Erro na query:', {
                text,
                error: error.message
            });
            throw error;
        }
    },

    get: async (sql, params) => {
        const result = await pool.query(sql, params);
        return result.rows[0];
    },

    all: async (sql, params) => {
        const result = await pool.query(sql, params);
        return result.rows;
    },

    // Função para transações
    transaction: async (callback) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

// Função melhorada para criar as tabelas
async function initializeTables() {
    try {
        await db.transaction(async (client) => {
            // Criação da tabela de usuários primeiro (devido às foreign keys)
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                );
            `);

            // Tabela de clientes
            await client.query(`
                CREATE TABLE IF NOT EXISTS clients (
                    id SERIAL PRIMARY KEY,
                    clientName TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    date TEXT NOT NULL,
                    type TEXT,
                    plan TEXT,
                    value DECIMAL NOT NULL CHECK (value >= 0),
                    hasSignal TEXT DEFAULT 'nao',
                    signalValue DECIMAL DEFAULT 0 CHECK (signalValue >= 0),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Tabela de despesas
            await client.query(`
                CREATE TABLE IF NOT EXISTS expenses (
                    id SERIAL PRIMARY KEY,
                    expenseType TEXT NOT NULL,
                    expenseDate TEXT NOT NULL,
                    expenseValue DECIMAL NOT NULL CHECK (expenseValue >= 0),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Função para atualizar o updated_at automaticamente
            await client.query(`
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);

            // Triggers para atualizar updated_at
            const tables = ['clients', 'expenses'];
            for (const table of tables) {
                await client.query(`
                    DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
                    CREATE TRIGGER update_${table}_updated_at
                        BEFORE UPDATE ON ${table}
                        FOR EACH ROW
                        EXECUTE FUNCTION update_updated_at_column();
                `);
            }
        });

        console.log('[Database] Tabelas e triggers criados com sucesso');
    } catch (err) {
        console.error('[Database] Erro ao criar tabelas:', err);
        throw err;
    }
}

// Função para testar a conexão
async function testConnection() {
    try {
        const result = await db.query('SELECT NOW()');
        console.log('[Database] Conexão testada com sucesso:', result.rows[0]);
        return true;
    } catch (err) {
        console.error('[Database] Erro ao testar conexão:', err);
        return false;
    }
}

// Inicialização
(async () => {
    if (await testConnection()) {
        await initializeTables();
    } else {
        console.error('[Database] Não foi possível inicializar as tabelas devido a erro na conexão');
    }
})();

module.exports = { db, pool };