const express = require('express');
const router = express.Router();
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;
const tokenCheck = require('../middlewares/tokenCheck');

router.get('/:type?', tokenCheck, async (req, res) => { // Adicionado o parâmetro 'type' como opcional
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('WR00021');
    let query = {};

    if (req.params.type) { // Se o parâmetro 'type' for fornecido, atualize a query
      query.type = req.params.type;
      if (query.type !== "server" && query.type !== "workstation" && query.type !== "linux") { // Verifique se o 'type' é válido
        return res.status(400).json({ message: "Invalid type parameter" });
      }
    }

    const doc = await collection.findOne(query);

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
