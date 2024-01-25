const express = require('express');
const router = express.Router();
const { appendLog } = require('../utilities/log');
const tokenCheck = require('../middlewares/tokenCheck');
const adminCheck = require('../middlewares/adminCheck');

router.post('/kill-processes', tokenCheck, adminCheck, async (req, res) => {
    const { pid, hostname, process_name } = req.body;

    if (!pid || !hostname) {
        return res.status(400).json({ error: 'PID or HOSTNAME not provided' });
    }

    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const dbProcesses = dbEngenharia.db('deviceCommands');
        const dbDevices = dbEngenharia.db('Devices');

        const deviceCollection = dbDevices.collection('deviceList');
        const device = await deviceCollection.findOne({ hostname: hostname });

        if (!device || !device.ip) {
            return res.status(404).json({ error: 'Device not found or IP not available' });
        }

        const collection = dbProcesses.collection('commands');

        // Verificação de duplicidade
        const existingCommand = await collection.findOne({
            pid: pid,
            hostname: hostname,
            process_name: process_name,
            status: 'pending'
        });

        if (existingCommand) {
            return res.status(409).json({ error: 'A command to kill this process is already pending' });
        }

        const killCommandDocument = {
            pid: pid,
            hostname: hostname,
            ip: device.ip,
            process_name: process_name,
            command: 'kill-process',
            status: 'pending'
        };

        await collection.insertOne(killCommandDocument);

        res.status(202).json({ message: `PID ${pid} registered for kill in database for device ${hostname}` });
        appendLog(req.login, `ran kill process command on process ${process_name} with pid ${pid} in hostname ${hostname}`);
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).json({ error: 'Error sending command, try again' });
    }
});

router.post('/start-service', tokenCheck, adminCheck, async (req, res) => {
    const { service, hostname } = req.body;

    if (!service || !hostname) {
        return res.status(400).send('service or HOSTNAME not provided');
    }

    try {
        // Usando a conexão já estabelecida de app.locals
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const dbProcesses = dbEngenharia.db('deviceCommands');
        const dbDevices = dbEngenharia.db('Devices');
        
        // Buscando o IP pelo hostname na coleção deviceList
        const deviceCollection = dbDevices.collection('deviceList');
        const device = await deviceCollection.findOne({ hostname: hostname });

        if (!device || !device.ip) {
            return res.status(404).send('Device not found or IP not available');
        }

        const collection = dbProcesses.collection('commands');

        // Criando um novo documento
        const killCommandDocument = {
            service: service,
            hostname: hostname,
            ip: device.ip,
            command: 'start-service',
            status: 'pending'
        };

        // Inserindo o documento na coleção
        await collection.insertOne(killCommandDocument);
        res.status(202).send({message : `service ${service} registered for start in database for device ${hostname}`});
        appendLog(req.login, `ran the start service command for the service ${service} on device ${hostname}`);
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('error sending command, try again');
    }
});

router.post('/stop-service', tokenCheck, adminCheck, async (req, res) => {
    const { service, hostname } = req.body;

    if (!service || !hostname) {
        return res.status(400).send('service or HOSTNAME not provided');
    }

    try {
        // Usando a conexão já estabelecida de app.locals
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const dbProcesses = dbEngenharia.db('deviceCommands');
        const dbDevices = dbEngenharia.db('Devices');
        
        // Buscando o IP pelo hostname na coleção deviceList
        const deviceCollection = dbDevices.collection('deviceList');
        const device = await deviceCollection.findOne({ hostname: hostname });

        if (!device || !device.ip) {
            return res.status(404).send('Device not found or IP not available');
        }

        const collection = dbProcesses.collection('commands');

        // Criando um novo documento
        const killCommandDocument = {
            service: service,
            hostname: hostname,
            ip: device.ip,
            command: 'stop-service',
            status: 'pending'
        };

        // Inserindo o documento na coleção
        await collection.insertOne(killCommandDocument);
    
        res.status(202).send({message : `service ${service} registered for stop in database for device ${hostname}`});
        appendLog(req.login, `ran the stop service command for the service ${service} on device ${hostname}`);
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('error sending command, try again');
    }
});

router.post('/close-session', tokenCheck, adminCheck, async (req, res) => {
    const { session_id, hostname, username } = req.body;

    if (!session_id || !hostname) {
        return res.status(400).send('service or HOSTNAME not provided');
    }

    try {
        // Usando a conexão já estabelecida de app.locals
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const dbProcesses = dbEngenharia.db('deviceCommands');
        const dbDevices = dbEngenharia.db('Devices');
        
        // Buscando o IP pelo hostname na coleção deviceList
        const deviceCollection = dbDevices.collection('deviceList');
        const device = await deviceCollection.findOne({ hostname: hostname });

        if (!device || !device.ip) {
            return res.status(404).send('Device not found or IP not available');
        }

        const collection = dbProcesses.collection('commands');

        // Criando um novo documento
        const killCommandDocument = {
            session_id: session_id,
            hostname: hostname,
            ip: device.ip,
            command: 'close-session',
            status: 'pending'
        };

        // Inserindo o documento na coleção
        await collection.insertOne(killCommandDocument);
    
        res.status(202).send({message : `user ${username} will be kicked out of the session on the device ${hostname}`});
        appendLog(req.login, `terminated the user ${username} session on the device ${hostname}`);
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('error sending command, try again');
    }
});


module.exports = router;
