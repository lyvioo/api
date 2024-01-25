const express = require('express');
const tokenCheck = require('../middlewares/tokenCheck');
const adminCheck = require('../middlewares/adminCheck');
const { appendFile } = require('fs');
const { appendLog } = require('../utilities/log');
const router = express.Router();

// Rota para atualizar as configurações do AD
router.put('/update-ad', tokenCheck, async (req, res) => {
    try {
        const { url, baseDN, username, passwd, allowedGroupName, domain } = req.body;

        if (!url || !baseDN || !username || !passwd || !allowedGroupName || !domain) {
            return res.status(400).send('All fields are required.');
        }

        const client = await req.app.locals.dbEngenhariaTest;
        const db = client.db('frontConfig');
        const collection = db.collection('ADSettings'); // Substitua YOUR_COLLECTION_NAME pelo nome da sua coleção

        const updateFields = {
            'adConfig.url': url,
            'adConfig.baseDN': baseDN,
            'adConfig.username': username,
            'adConfig.password': passwd,
            'adConfig.allowedGroupName': allowedGroupName,
            'adConfig.domain': domain
        };

        await collection.updateOne({}, { $set: updateFields }, { upsert: true });

        res.status(200).send('adConfig updated or created successfully.');
        appendLog(req.login, 'Changed AD config');

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error: ' + err.message);
    }
});

router.get('/ad-view', tokenCheck, adminCheck, async (req, res) => {
    try {
        // Usando a conexão já estabelecida de app.locals
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('frontConfig');
        const collection = db.collection('ADSettings');
  
        const doc = await collection.findOne({});

        if (doc) {
            delete doc._id;
            delete doc.adConfig.password;
            res.json(doc);
        } else {
            res.status(404).json({ message: "AD Config not found" });
        }
  
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});




module.exports = router;
