const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');


const tokenCheck = require('../middlewares/tokenCheck');

router.get('/platformLog', tokenCheck, async (req, res) => {
    try {
        // Parâmetros de paginação com valores padrão
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        const logFilePath = path.join(__dirname, '../logs/frontLog.json');
        const fileContent = await fs.readFile(logFilePath, 'utf8');
        const lines = fileContent.trim().split('\n');

        // Converter linhas para JSON e inverter a ordem para começar do mais recente
        const jsonData = lines.reverse().map(line => {
            try {
                return JSON.parse(line);
            } catch (error) {
                console.error('Error parsing line to JSON:', line, error);
                return null;
            }
        }).filter(line => line !== null);

        // Calcular o intervalo de linhas a serem retornadas
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Pegar apenas o subconjunto necessário de linhas
        const paginatedLines = jsonData.slice(startIndex, endIndex);

        res.json(paginatedLines);
    } catch (error) {
        console.error('Error reading log file:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/platformLogByRange', tokenCheck, async (req, res) => {
    try {
        // Converter as datas para UTC
        const startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
        const endDate = new Date(req.query.endDate + 'T23:59:59.999Z');

        // Verifica se as datas são válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).send('Invalid dates');
        }

        const logFilePath = path.join(__dirname, '../logs/frontLog.json');
        const fileContent = await fs.readFile(logFilePath, 'utf8');
        const lines = fileContent.trim().split('\n');

        // Filtrar logs pelo intervalo de datas
        const filteredLogs = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (error) {
                console.error('Error parsing line to JSON:', line, error);
                return null;
            }
        }).filter(log => {
            if (!log) return false;
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });

        res.json(filteredLogs);
    } catch (error) {
        console.error('Error reading log file:', error);
        res.status(500).send('Internal Server Error');
    }
});



router.get('/platformLog/download', tokenCheck, (req, res) => {
    const logFilePath = path.join(__dirname, '../logs/frontLog.json');
    res.download(logFilePath, 'frontLog.json', (err) => {
        if (err) {
            console.error('Error during file download:', err);
            res.status(500).send('Unable to download the file');
        }
    });
});

module.exports = router;
