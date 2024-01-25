const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    console.log('req recebida');
    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('Devices');
        const collection = db.collection('deviceList');

        const clientIp = req.ip; // ou extrair de req.headers['x-forwarded-for']
        const clientHostname = req.body.hostname;
      
        // Verifica se já existe um documento com o mesmo hostname ou IP
        const existingDoc = await collection.findOne({ 
            $or: [{ hostname: clientHostname }, { ip: clientIp }]
        });

        if (existingDoc) {
            // Atualiza o documento se o IP ou hostname for diferente
            await collection.updateOne(
                { _id: existingDoc._id },
                { $set: { hostname: clientHostname, ip: clientIp } }
            );
        } else {
            // Cria um novo documento se não existir
            await collection.insertOne({ hostname: clientHostname, ip: clientIp });
        }

        res.status(200).json({ message: "Machine registered/updated successfully" });
    } catch (error) {
        console.error('Error in registering/updating machine:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
;

module.exports = router;
