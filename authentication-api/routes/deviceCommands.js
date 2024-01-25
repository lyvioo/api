const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7);
        console.log(ip);
    }

    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('deviceCommands');
        const collection = db.collection('commands');

        const commandDocument = await collection.findOne(
            { ip: ip, status: 'pending' },
            { projection: { hostname: 0, ip: 0, status: 0 } }
        );

        if (commandDocument) {
            await collection.updateOne({ _id: commandDocument._id }, { $set: { status: 'success' } });

            delete commandDocument._id;

            res.json(commandDocument);
        } else {
            res.status(404).send('No command found for this IP');
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('Internal server error');
    }
});


module.exports = router;