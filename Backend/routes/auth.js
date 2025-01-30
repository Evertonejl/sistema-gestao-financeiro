const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

// Rota de registro
router.post('/register', async (req, res) => {
   try {
       const { email, password, name } = req.body;
       
       // Verificar se usuário já existe
       const userExists = await db.get(
           'SELECT * FROM users WHERE email = $1',
           [email]
       );
       
       if (userExists) {
           return res.status(400).json({ message: 'Email já registrado' });
       }

       // Hash da senha
       const hashedPassword = await bcrypt.hash(password, 10);

       // Inserir usuário
       const result = await db.query(
           'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
           [email, hashedPassword, name]
       );

       // Gerar token para o novo usuário
       const token = jwt.sign(
           { userId: result.rows[0].id },
           process.env.JWT_SECRET,
           { expiresIn: '24h' }
       );

       res.status(201).json({
           message: 'Usuário criado com sucesso',
           user: result.rows[0],
           token
       });
   } catch (err) {
       console.error('Erro no registro:', err);
       res.status(500).json({ message: 'Erro ao registrar usuário' });
   }
});

// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Tentativa de login:', { email });

        const user = await db.get(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name 
            } 
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
});

// Rota para renovar token
router.post('/renew-token', async (req, res) => {
   try {
       const oldToken = req.headers.authorization?.split(' ')[1];
       
       if (!oldToken) {
           return res.status(401).json({ message: 'Token não fornecido' });
       }

       // Verificar token atual
       const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
       
       // Buscar usuário
       const user = await db.get(
           'SELECT * FROM users WHERE id = $1',
           [decoded.userId]
       );

       if (!user) {
           return res.status(401).json({ message: 'Usuário não encontrado' });
       }

       // Gerar novo token
       const newToken = jwt.sign(
           { 
               userId: user.id,
               email: user.email 
           },
           process.env.JWT_SECRET,
           { 
               expiresIn: '24h',
               algorithm: 'HS256'
           }
       );

       res.json({ 
           token: newToken,
           user: { 
               id: user.id, 
               email: user.email, 
               name: user.name 
           }
       });
   } catch (err) {
       if (err.name === 'TokenExpiredError') {
           return res.status(401).json({ 
               message: 'Token expirado',
               details: 'Por favor, faça login novamente'
           });
       }
       console.error('Erro ao renovar token:', err);
       res.status(500).json({ message: 'Erro ao renovar token' });
   }
});

// Rota para verificar status do token
router.get('/verify-token', async (req, res) => {
   try {
       const token = req.headers.authorization?.split(' ')[1];
       
       if (!token) {
           return res.status(401).json({ message: 'Token não fornecido' });
       }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       res.json({ 
           valid: true,
           userId: decoded.userId,
           expiresIn: decoded.exp
       });
   } catch (err) {
       if (err.name === 'TokenExpiredError') {
           return res.status(401).json({ 
               valid: false,
               message: 'Token expirado',
               details: 'Por favor, faça login novamente'
           });
       }
       res.status(401).json({ 
           valid: false,
           message: 'Token inválido' 
       });
   }
});

module.exports = router;