const express = require('express');
const router = express.Router();
const tokenCheck = require('../middlewares/tokenCheck');
const appendLog = require('../utilities/log').appendLog;

router.post('/', tokenCheck, async (req, res) => {
    const authHeader = req.headers.authorization;
    const login = req.login;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token is missing or invalid' });
    }

    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('Tokens');

        const revokedTokensCollection = db.collection('revokedTokens');

        const count = await revokedTokensCollection.countDocuments();
        if (count > 200) {
            await revokedTokensCollection.deleteMany({});
        }

        await revokedTokensCollection.insertOne({ token: authHeader, revokedAt: new Date() });

        res.status(200).json({ message: 'Logout successful' });
        appendLog(login, "Logged out");
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
