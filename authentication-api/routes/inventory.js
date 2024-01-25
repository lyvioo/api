const express = require('express');
const router = express.Router();

const removeUnwantedFields = (doc) => {
  delete doc._id;
  delete doc.timestamp;
  return doc;
};

router.get('/:hostname', async (req, res) => {
  try {
      const hostname = req.params.hostname;

      const dbEngenharia = await req.app.locals.dbEngenhariaTest;
      const db = dbEngenharia.db('PreEngenharia');
      const collection = db.collection('Inventory');
      
      const doc = await collection.findOne({ "system_info.hostname": hostname });

      if (doc) {
          const modifiedDoc = removeUnwantedFields(doc);
          res.json(modifiedDoc);
      } else {
          res.status(404).json({ message: "Hostname not found" });
      }

  } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
