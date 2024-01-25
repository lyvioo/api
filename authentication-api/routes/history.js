const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectID = mongoose.Types.ObjectId;

router.get('/:hostname', async (req, res) => {
  try {
      const { hostname } = req.params;
      const hours = parseFloat(req.query.hours);
      const startDateStr = req.query.startDate; // formato: 'AAAA-MM-DD'
      const endDateStr = req.query.endDate;     // formato: 'AAAA-MM-DD'

      // Verificação de horas e datas
      if (isNaN(hours) && (!startDateStr || !endDateStr)) {
          return res.status(400).json({ message: "Forneça ou valor de horas ou intervalo de datas válido." });
      }

      let startTime, endTime;
      if (hours) {
          const currentTime = new Date();
          startTime = new Date(currentTime.getTime() - hours * 60 * 60 * 1000);
          endTime = currentTime;
      } else {
          startTime = new Date(startDateStr);
          endTime = new Date(endDateStr);
          endTime.setDate(endTime.getDate() + 1); // Adiciona um dia para incluir o endDate
      }

      const dbEngenharia = req.app.locals.dbEngenharia;
      const collection = dbEngenharia.collection('test');

      const doc = await collection.findOne({ "hostname": hostname });

      if (!doc) {
          return res.status(404).json({ message: "Hostname não encontrado." });
      }

      const recentLogins = doc.logins.filter(login => {
          const loginDateTime = new Date(login.loggin_date_time);
          return loginDateTime >= startTime && loginDateTime < endTime;
      });

      const result = recentLogins.map(login => ({
          user: login.user,
          loggin_date_time: login.loggin_date_time
      }));

      res.json(result);

  } catch (error) {
      console.error('Erro ao buscar documento:', error);
      res.status(500).json({ message: "Erro Interno do Servidor" });
  }
});


module.exports = router;
