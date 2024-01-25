const express = require('express');
const router = express.Router();
const tokenCheck = require('../middlewares/tokenCheck');

router.get('/:type?', tokenCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('commonprocess');

    // Procura pelo único documento existente na coleção.
    const doc = await collection.findOne({});

    if (doc) {
      const type = req.params.type;
      // Normaliza o tipo para capitalizar a primeira letra, visto que os campos no documento estão com a primeira letra maiúscula
      const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

      if (normalizedType && doc[normalizedType]) {
        // Retorna um objeto com uma chave nomeada como o tipo e o valor sendo o array correspondente
        const responseObject = {
          [normalizedType]: doc[normalizedType]
        };
        res.json(responseObject);
      } else {
        // Se o array não existir para o tipo especificado, retorne um erro
        res.status(404).json({ message: `Array for type ${type} not found` });
      }
    } else {
      // Se não encontrar o documento, retorne uma mensagem de erro
      res.status(404).json({ message: "Document not found" });
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
