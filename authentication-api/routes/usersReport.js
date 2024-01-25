const express = require('express');
const router = express.Router();
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;


const tokenCheck = require('../middlewares/tokenCheck');

router.get('/:hostname?', tokenCheck, async (req, res) => {
  try {
      const dbEngenharia = await req.app.locals.dbEngenhariaTest;
      const db = dbEngenharia.db('PreEngenharia');
      const collection = db.collection('usersReport');

      // Considerando que existe apenas um documento na coleção que contém os arrays
      const doc = await collection.findOne({});

      function sanitizeKey(key) {
        return key.replace(/\./g, '_');
    }

    const hostname = sanitizeKey(req.params.hostname ? req.params.hostname.toUpperCase() : null)

    if (!hostname) {
      const modifiedDoc = removeUnwantedFields(doc);
      // Verifique se o documento não é vazio
      if (Object.keys(modifiedDoc).length === 0) {
        return res.status(404).json({ message: "No data found for the requested hostname" });
      }
      res.json(modifiedDoc);
    } else if (doc && doc[hostname]) {
        const modifiedArray = removeUnwantedFields(doc[hostname]);
        // Verifique se o array não é vazio após a remoção dos campos indesejados
        if (modifiedArray.length === 0) {
          return res.status(404).json({ message: "no logins for the provided hostname" });
        }
        const responseObj = {
            [hostname]: modifiedArray
        };
        res.json(responseObj);
    } else {
        res.status(404).json({ message: "Array not found for the provided hostname" });
    }

} catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
});


module.exports = router;
