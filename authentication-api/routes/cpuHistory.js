const express = require('express');
const router = express.Router();
const tokenCheck = require('../middlewares/tokenCheck');

router.get('/:hostname', tokenCheck, async (req, res) => {
    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('cpu_history');

        const hostname = req.params.hostname;
        
        // Cria uma expressão regular para busca insensível a maiúsculas e minúsculas
        const hostnameRegex = new RegExp(`^${hostname}$`, 'i');

        // Busca o documento com o hostname correspondente
        const document = await collection.findOne({ hostname: { $regex: hostnameRegex } });

        if (!document || !document.cpu_usage_history) {
            return res.status(404).json({message: "No records found for the specified hostname."});
        }

        // Define os intervalos de tempo
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Função auxiliar para calcular a média
        function calculateAverage(data) {
            if (data.length === 0) return 0;
            const sum = data.reduce((acc, entry) => acc + entry.cpu_usage, 0);
            const average = sum / data.length;
            return parseFloat(average.toFixed(2)); // Formata a média para duas casas decimais
        }

        // Função para filtrar e processar o histórico de uso da CPU
        function filterAndProcessData(startTime) {
            return document.cpu_usage_history.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= startTime && entryDate <= now;
            }).map(entry => ({
                cpu_usage: parseInt(entry.cpu_usage.replace('%', '')),
                timestamp: entry.timestamp
            }));
        }

        // Calcula as médias
        const cpuUsageLast12Hours = filterAndProcessData(twelveHoursAgo);
        const cpuUsageLast24Hours = filterAndProcessData(twentyFourHoursAgo);
        const cpuUsageLastWeek = filterAndProcessData(oneWeekAgo);

        const average12h = calculateAverage(cpuUsageLast12Hours);
        const average24h = calculateAverage(cpuUsageLast24Hours);
        const average1w = calculateAverage(cpuUsageLastWeek);

        // Prepara o objeto de resposta
        const response = {
            average12h,
            average24h,
            average1w,
            cpuUsageLast12Hours: cpuUsageLast12Hours
        };

        res.json(response);
    } catch (error) {
        console.error('Erro ao buscar histórico de CPU:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

module.exports = router;
