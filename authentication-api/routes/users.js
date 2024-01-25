const express = require('express');
const router = express.Router();
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;


const tokenCheck = require('../middlewares/tokenCheck');

router.get('/', tokenCheck, async (req, res) => {
  try {
      // Usando a conexão já estabelecida de app.locals
      const dbEngenharia = await req.app.locals.dbEngenhariaTest;
      const db = dbEngenharia.db('PreEngenharia');
      const collection = db.collection('users');

      const doc = await collection.findOne({});

      if (doc) {
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
