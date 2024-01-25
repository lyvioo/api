const express = require("express");
const router = express.Router();
const tokenCheck = require("../middlewares/tokenCheck");
const adminCheck = require("../middlewares/adminCheck");
const removeUnwantedFields =
  require("../utilities/removeFields").removeUnwantedFields;

/* function isValidIPRange(ipRangeObj) {
  if (Object.keys(ipRangeObj).length !== 1) {
    return false;
  }

  const ipRange = Object.values(ipRangeObj)[0];
  const [start, end] = ipRange.split("-");

  return Address4.isValid(start) && Address4.isValid(end);
} */

router.post(
  "/config/ip-ranges/set",
  tokenCheck,
  adminCheck,
  async (req, res) => {
    try {
      const { ipRanges } = req.body;

      if (!Array.isArray(ipRanges) || ipRanges.length === 0) {
        return res.status(400).json({ message: "No IP ranges provided." });
      }

      const client = await req.app.locals.dbEngenhariaTest;
      const db = client.db("frontConfig");
      const collection = db.collection("networkScan");

      for (const range of ipRanges) {
        const { description, start, end, VLAN } = range;

        if (typeof end !== 'string' || !end) {
          return res.status(400).json({ message: "Invalid or missing 'end' value in one of the ranges." });
        }

        let lastPartOfEnd;
        try {
          lastPartOfEnd = end.split(".").pop();
        } catch (error) {
          return res.status(400).json({ message: "Error processing 'end' value in one of the ranges." });
        }

        const ipRange = `${start}-${lastPartOfEnd}`;

        // Inserir ou atualizar intervalo de IP
        const newRangeObject = {
          description,
          ipRange,
          start,
          end,
          VLAN,
          status: "ok",
        };

        await collection.updateOne(
          {}, // critérios de seleção do documento
          {
            $push: { ipRanges: newRangeObject },
            $currentDate: { last_update: true },
          },
          { upsert: true }
        );
      }

      res.status(200).json({ message: "IP ranges processed successfully." });
    } catch (error) {
      console.error("Error during IP range processing:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);



router.get("/config/ip-ranges", tokenCheck, adminCheck, async (req, res) => {
  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db("frontConfig");
    const collection = db.collection("networkScan");

    const doc = await collection.findOne({});

    if (doc) {
      const modifiedDoc = removeUnwantedFields(doc);
      res.json(modifiedDoc);
    } else {
      res.status(404).json({ message: "ip ranges not found" });
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete(
  "/config/ip-ranges/delete",
  tokenCheck,
  adminCheck,
  async (req, res) => {
    try {
      const ipRangesToRemove = req.body.ipRangesToRemove;

      if (!ipRangesToRemove || !Array.isArray(ipRangesToRemove)) {
        return res.status(400).json({
          message: "Invalid request. ipRangesToRemove must be an array.",
        });
      }

      const client = await req.app.locals.dbEngenhariaTest;
      const db = client.db("frontConfig");
      const collection = db.collection("networkScan");

      const documents = await collection.find({}).toArray();

      for (const doc of documents) {
        const ipRanges = doc.ipRanges.filter(
          (rangeObj) =>
            !ipRangesToRemove.some((ipRange) =>
              Object.values(rangeObj).includes(ipRange)
            )
        );

        // Atualizar o documento se necessário
        if (ipRanges.length !== doc.ipRanges.length) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { ipRanges: ipRanges } }
          );
        }
      }

      res.json({ message: "IP ranges deleted successfully." });
    } catch (error) {
      console.error("Error during IP range deletion:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

module.exports = router;
