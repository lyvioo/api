const express = require('express');
const net = require('net');
const router = express.Router();
const tokenCheck = require('../middlewares/tokenCheck');

router.get('/', tokenCheck, async (req, res) => {
    try {
        if (req.query.command !== 'start') {
            return res.status(400).json({ message: "Invalid command" });
        }

        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('frontConfig');
        const collection = db.collection('networkScan');

        const doc = await collection.findOne({});

        if (!doc || !doc.gateways || !doc.prefixes) {
            return res.status(404).json({ message: "Document or gateways/prefixes not found" });
        }

        const client = net.createConnection('/tmp/networkScanService.sock');
        
        client.on('connect', () => {
            client.write(JSON.stringify({ gateways: doc.gateways, prefixes: doc.prefixes }));
        });

        client.on('data', (data) => {
            const response = JSON.parse(data.toString());
            
            if (response.error) {
                res.status(500).json({ message: response.message });
            } else {
                res.json(response);
            }

            client.end();
        });

    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
