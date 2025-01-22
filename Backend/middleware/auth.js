const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Logs para debug
    console.log('Auth Header:', req.headers.authorization);
    console.log('JWT Secret:', process.env.JWT_SECRET?.slice(0, 3) + '...');

    try {
        // Pega o header de autorização
        const authHeader = req.headers.authorization;

        // Verifica se o header existe
        if (!authHeader) {
            console.log('Header de autorização ausente');
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        // Verifica se o formato é "Bearer token"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log('Formato do token inválido');
            return res.status(401).json({ message: 'Token mal formatado' });
        }

        const token = parts[1];

        // Verifica se o token é válido
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('Erro na verificação do token:', err.message);
                return res.status(401).json({ message: 'Token inválido' });
            }

            // Adiciona o ID do usuário decodificado à requisição
            req.userId = decoded.userId;
            next();
        });
    } catch (err) {
        console.error('Erro no middleware de autenticação:', err);
        return res.status(500).json({ message: 'Erro interno no servidor' });
    }
};

module.exports = authMiddleware;