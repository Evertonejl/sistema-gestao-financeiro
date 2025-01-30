const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuração do CORS mais específica
app.use(cors({
   origin: process.env.FRONTEND_URL || '*', // Use a URL do frontend em produção
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization'],
   credentials: true,
   maxAge: 86400 // Cache das definições CORS por 24 horas
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de log melhorado
app.use((req, res, next) => {
   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
   console.log('Headers:', {
       authorization: req.headers.authorization ? 'Present' : 'Not Present',
       contentType: req.headers['content-type'],
       origin: req.headers.origin
   });
   next();
});

// Rota de health check
app.get('/api/health', (req, res) => {
   res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       environment: process.env.NODE_ENV
   });
});

// Importação das rotas
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const expensesRoutes = require('./routes/expenses');
const authMiddleware = require('./middleware/auth');

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);

// Rotas HTML - devem vir depois das rotas API
app.get('/login', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para lidar com rotas não encontradas
app.use((req, res) => {
   const error = `Rota não encontrada: ${req.method} ${req.url}`;
   console.log(error);
   
   // Se a requisição espera JSON
   if (req.headers.accept && req.headers.accept.includes('application/json')) {
       return res.status(404).json({ 
           message: 'Rota não encontrada',
           path: req.url,
           method: req.method
       });
   }
   
   // Se for uma requisição de página
   res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Handler de erros melhorado
app.use((err, req, res, next) => {
   console.error('Erro na aplicação:', {
       error: err.message,
       stack: err.stack,
       path: req.path,
       method: req.method,
       timestamp: new Date().toISOString()
   });

   // Tratamento específico para erros conhecidos
   if (err.name === 'UnauthorizedError') {
       return res.status(401).json({
           message: 'Token inválido ou expirado',
           details: err.message
       });
   }

   if (err.name === 'ValidationError') {
       return res.status(400).json({
           message: 'Erro de validação',
           details: err.message
       });
   }

   // Erro genérico
   res.status(500).json({
       message: 'Erro interno do servidor',
       error: process.env.NODE_ENV === 'development' ? err.message : undefined
   });
});

// Inicialização do servidor com verificação de ambiente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`[${new Date().toISOString()}] Servidor iniciado`);
   console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
   console.log(`Porta: ${PORT}`);
   console.log(`CORS origin: ${process.env.FRONTEND_URL || '*'}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
   console.error('Uncaught Exception:', error);
   // Em produção, você pode querer reiniciar o servidor
   if (process.env.NODE_ENV === 'production') {
       process.exit(1);
   }
});