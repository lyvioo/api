const express = require("express");
const router = express.Router();
const tokenCheck = require("../middlewares/tokenCheck");

router.post("/schedule-scan", tokenCheck, async (req, res) => {
  try {
    const dbNetWork = await req.app.locals.dbEngenhariaTest;
    const db = dbNetWork.db("NetWork");
    const collection = db.collection("scheduledScans");

    // Recebendo os dados do corpo da requisição
    let scheduleData = req.body;

    // Verifica se já existe um agendamento para este usuário
    const existingSchedule = await collection.findOne({
      username: scheduleData.username,
    });
    if (existingSchedule) {
      return res
        .status(409)
        .json({ message: "Schedule already exists for this user" });
    }

    // Processamento do ipRange e adição de campos lastRun e nextRun
    // Seu código de processamento do ipRange aqui...

    // Inserindo os dados no banco de dados
    const result = await collection.insertOne(scheduleData);

    if (result.acknowledged) {
      return res.status(201).json({
        message: "Schedule created successfully",
        _id: result.insertedId,
      });
    } else {
      console.log("Insert failed, acknowledged:", result.acknowledged);
      return res.status(400).json({ message: "Failed to create schedule" });
    }
  } catch (error) {
    console.error("Error inserting schedule:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/add-scan/:username", tokenCheck, async (req, res) => {
  console.log(req.body);
  try {
    const username = req.params.username;
    const dbNetWork = await req.app.locals.dbEngenhariaTest;
    const db = dbNetWork.db("NetWork");
    const collection = db.collection("scheduledScans");

    const { newScan, updates } = req.body;

    // Adicionar um novo scan, se fornecido
    if (newScan) {
      newScan.lastRun = null;
      newScan.nextRun = null;
      await collection.updateOne(
        { username: username },
        { $push: { schedules: newScan } }
      );
    }

    // Atualizar scans existentes, se fornecidos
    if (updates && updates.length > 0) {
      for (const update of updates) {
        const updateFields = {};
        for (const key in update) {
          if (update.hasOwnProperty(key) && key !== "scanId") {
            updateFields[`schedules.$.${key}`] = update[key];
          }
        }

        await collection.updateOne(
          { username: username, "schedules.scanId": update.scanId },
          { $set: updateFields }
        );
      }
    }

    res.status(200).json({ message: "Scans managed successfully" });
  } catch (error) {
    console.error("Error managing scans:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.get("/schedules/:username", tokenCheck, async (req, res) => {
  try {
    const username = req.params.username; // O username do usuário

    const dbNetWork = await req.app.locals.dbEngenhariaTest;
    const db = dbNetWork.db("NetWork");
    const collection = db.collection("scheduledScans");

    const userSchedules = await collection.findOne({ username: username });

    if (userSchedules) {
      res.status(200).json(userSchedules.schedules);
    } else {
      res.status(404).json({ message: "No schedules found for this user" });
    }
  } catch (error) {
    console.error("Error retrieving schedules:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

module.exports = router;
