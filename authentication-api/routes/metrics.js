const express = require('express');
const router = express.Router();
const metricsMiddleware = require('../middlewares/metricsMid');
const { client } = require('../metrics/metrics');

// Aplicando o middleware de métricas às rotas
router.use(metricsMiddleware);

// Rota para expor métricas para o Prometheus
router.get('/', async (req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  

module.exports = router;
