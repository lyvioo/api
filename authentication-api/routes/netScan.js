const path = "/tmp/netScan";
const express = require("express");
const router = express.Router();
const tokenCheck = require("../middlewares/tokenCheck");
const adminCheck = require("../middlewares/adminCheck");
const fs = require("fs");
const net = require("net");
const removeUnwantedFields =
  require("../utilities/removeFields").removeUnwantedFields;

router.get("/start-scan/:range/:type", tokenCheck, adminCheck, async (req, res) => {
  const ipRange = req.params.range;
  const scanType = req.params.type;

  if (scanType !== "complete" && scanType !== "simple" && scanType !== "stop") {
    res.status(404).send(`Please provide a valid scan type.`);
  }

  if (ipRange === "") {
    res.status(404).send(`Invalid range parameter.`);
  }

  try {
    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db("frontConfig");
    const collection = db.collection("networkScan");

    const documents = await collection.find({}).toArray();
    let canScan = false;

    // Function to convert IP range to database format
    function formatIpRange(range) {
      const parts = range.split("-");
      if (parts.length !== 2) return range;

      const startIpParts = parts[0].split(".");
      const endIpPart = parts[1].split(".").pop();

      return `${startIpParts.join(".")}-${endIpPart}`;
    }

    const convertedRange = formatIpRange(ipRange);

    if (!convertedRange) {
      res.status(400).send(`Invalid IP range format.`);
      return;
    }

    for (const document of documents) {
      for (const rangeObj of document.ipRanges) {
        if (rangeObj.ipRange === convertedRange) {
          canScan = true;
          if (rangeObj.status === "running") {
            canScan = false;
            break;
          }
        }
      }
      if (!canScan) break;
    }

    if (!canScan) {
      res
        .status(400)
        .send(
          `Scan cannot be initiated for the range ${ipRange}, either not found or already running.`
        );
      return;
    }

    // Escrever no pipe nomeado
    fs.writeFile(path, `${scanType} {${ipRange}}\n`, { flag: "a" }, (err) => {
      if (err) {
        console.error("Error writing data in pipe:", err);
        res.status(500).send("Error sending scan command");
        return;
      }
      console.log(`Scan command sent for the range ${ipRange}`);

      res.send(`Scan command sent for the range ${ipRange}`);
    });
  } catch (error) {
    console.error("Error during the data retrieval process:", error);
    res.status(500).send("Error verifying scan status");
  }
});

router.get("/scan-results/:range", async (req, res) => {
  const ipRange = req.params.range;

  try {
    function formatIpRange(range) {
      const parts = range.split("-");
      if (parts.length !== 2) return range;

      const startIpParts = parts[0].split(".");
      const endIpPart = parts[1].split(".").pop();

      return `${startIpParts.join(".")}-${endIpPart}`;
    }

    const convertedRange = formatIpRange(ipRange);

    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db("NetWork");
    const collection = db.collection("scanResults");

    const doc = await collection.findOne({ ipRange: convertedRange });
    console.log(convertedRange);

    if (doc) {
      const modifiedDoc = removeUnwantedFields(doc);
      res.json(modifiedDoc);
    } else {
      res
        .status(404)
        .json({ message: "There are no scan results for this IP range" });
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
