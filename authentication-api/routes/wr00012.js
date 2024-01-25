const express = require('express');
const router = express.Router();
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;


const tokenCheck = require('../middlewares/tokenCheck');

router.get('/', tokenCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('WR00012');

      const doc = await collection.findOne({});

      if (doc) {
          // Remover os campos indesejados antes de enviar a resposta
          const modifiedDoc = removeUnwantedFields(doc);
          res.json(modifiedDoc);
      } else {
          res.status(404).json({ message: "Document not found" });
      }

  } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
