require('dotenv').config({ path: 'C:\\Users\\User\\Downloads\\authentication-api\\.env' });
const express = require('express');
const router = express.Router();

// Função para adicionar os dados enviados a uma array no MongoDB
async function addToArrayInMongo(data) {
    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('smtpConfigRoutes');

        // Estrutura da query modificada para adicionar a um array
        const query = { configId: 'unique_config_id' };
        const update = { $push: { smtpConfigs: data } };
        const options = { upsert: true };

        const result = await collection.updateOne(query, update, options);
        console.log(`Array de configurações SMTP atualizado com sucesso: ${result}`);
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Rota POST para receber e adicionar configurações SMTP a uma array
router.post('/', async (req, res) => {
    try {
        const smtpConfig = req.body;

        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('smtpConfigRoutes');

        // Estrutura da query modificada para adicionar a um array
        const query = { configId: 'unique_config_id' };
        const update = { $push: { smtpConfigs: smtpConfig } };
        const options = { upsert: true };

        const result = await collection.updateOne(query, update, options);
        console.log(`Array de configurações SMTP atualizado com sucesso: ${result}`);

        await addToArrayInMongo(smtpConfig);
        res.status(200).send('Configuração SMTP adicionada ao array no MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).send('Ocorreu um erro ao adicionar a configuração SMTP ao array.');
    }
});

module.exports = router;
