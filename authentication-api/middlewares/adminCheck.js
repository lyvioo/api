const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.TOKEN;
const { appendLog } = require('../utilities/log');

module.exports = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        const actionDescriptions = {
            '/api/imgupload': 'change company logo',
            '/api/register': 'create a new user',
            '/api/ad-config': 'change AD config',
            '/api/tageditor/remove-tag': 'delete tag',
            '/api/tageditor/add-tag': 'add tag',
            '/api/send-command/kill-process': 'kill process',
        };

        // Decodificar o token
        const decodedToken = jwt.verify(token, SECRET_KEY);
        const login = decodedToken.login; // Usando o login do payload do token

        // Consultar o MongoDB para verificar a role do usuário
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db("Users");
        const collection = db.collection("userCad");
        const userDoc = await collection.findOne({ login: login });

        if (!userDoc || userDoc.role !== 'admin') {
            const actionDescription = actionDescriptions[req.originalUrl] || 'perform this action';
            appendLog(login, `User ${login} cannot perform this action: ${actionDescription}, insufficient permissions`);
            return res.status(403).json({ message: 'User is not authorized to perform this action.' });
        }

        next();
    } catch (error) {
        appendLog('unknown', `Authentication failed: ${error.message}`);
        return res.status(401).json({ message: `Authentication failed: ${error.message}` });
    }
};