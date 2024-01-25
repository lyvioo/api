const express = require('express');
const router = express.Router();
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;


const tokenCheck = require('../middlewares/tokenCheck');

router.get('/:hostname', tokenCheck, async (req, res) => {
    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('processesHistory');

        const hostname = req.params.hostname;
        
        // Cria uma expressão regular para busca insensível a maiúsculas e minúsculas
        const hostnameRegex = new RegExp(`^${hostname}$`, 'i');

        // Busca o documento com o hostname correspondente
        const document = await collection.findOne({ hostname: { $regex: hostnameRegex } });

        if (!document || !document.process_count_history) {
            return res.status(404).json({ message: "No records found for the specified hostname." });
        }

        // Define o intervalo de tempo para as últimas 12 horas
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 12 * 60 * 60 * 1000);

        // Filtra o histórico de contagem de processos nas últimas 12 horas
        const processCountLast12Hours = document.process_count_history.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= startDate && entryDate <= endDate;
        });

        if (processCountLast12Hours.length === 0) {
            return res.status(404).json({ message: "There is no process history for this device in the last 12 hours." });
        }

        res.json(processCountLast12Hours);
    } catch (error) {
        console.error('Erro ao buscar histórico de processos:', error);
        res.status(500).send('Erro interno do servidor');
    }
});


module.exports = router;
