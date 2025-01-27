const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Logs detalhados para debug
    console.log('[Auth] Nova requisição:', {
        method: req.method,
        path: req.path,
        hasAuthHeader: !!req.headers.authorization
    });

    try {
        // Pega o header de autorização
        const authHeader = req.headers.authorization;

        // Verifica se o header existe
        if (!authHeader) {
            console.log('[Auth] Header de autorização ausente');
            return res.status(401).json({ 
                message: 'Token não fornecido',
                details: 'Authorization header não encontrado'
            });
        }

        // Verifica se o formato é "Bearer token"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log('[Auth] Formato do token inválido:', authHeader);
            return res.status(401).json({ 
                message: 'Token mal formatado',
                details: 'Formato esperado: Bearer <token>'
            });
        }

        const token = parts[1];

        // Log do token (apenas primeiros caracteres para segurança)
        console.log('[Auth] Token recebido:', token.substring(0, 10) + '...');
        console.log('[Auth] JWT Secret presente:', !!process.env.JWT_SECRET);

        // Verifica se o token é válido
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('[Auth] Erro na verificação do token:', {
                    name: err.name,
                    message: err.message
                });

                // Mensagens de erro mais específicas
                switch (err.name) {
                    case 'TokenExpiredError':
                        return res.status(401).json({ 
                            message: 'Token expirado',
                            details: 'Por favor, faça login novamente'
                        });
                    case 'JsonWebTokenError':
                        return res.status(401).json({ 
                            message: 'Token inválido',
                            details: 'Token não pode ser verificado'
                        });
                    default:
                        return res.status(401).json({ 
                            message: 'Erro na autenticação',
                            details: err.message
                        });
                }
            }

            // Log do usuário autenticado
            console.log('[Auth] Usuário autenticado:', {
                userId: decoded.userId,
                exp: new Date(decoded.exp * 1000)
            });

            // Adiciona o ID do usuário decodificado à requisição
            req.userId = decoded.userId;
            next();
        });
    } catch (err) {
        console.error('[Auth] Erro crítico no middleware:', err);
        return res.status(500).json({ 
            message: 'Erro interno no servidor',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

module.exports = authMiddleware;