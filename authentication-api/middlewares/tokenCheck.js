const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.TOKEN;

module.exports = async (req, res, next) => {
    // Lendo o token do cookie
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(403).json({ message: "No token provided" });
    }

    try {
        // Verificação do JWT
        jwt.verify(token, SECRET_KEY);

        // Acessando o MongoDB
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('Tokens'); // Substitua pelo nome do seu banco de dados
        const revokedTokensCollection = db.collection('revokedTokens');

        // Verificando se o token foi revogado
        const tokenRevogado = await revokedTokensCollection.findOne({ token: 'Bearer ' + token });

        if (tokenRevogado) {
            return res.status(401).json({ message: "Token has been revoked" });
        }

        // Token não foi revogado e é válido
        req.login = jwt.decode(token).login;
        return next();
    } catch (err) {
        // Erros de verificação do JWT
        return res.status(403).json({ message: "Invalid token" });
    }
};