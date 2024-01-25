router.post("/", tokenCheck, async (req, res) => {
  try {
    const { reportType, email, schedule } = req.body;

    if (!reportType || !schedule || !email) {
      return res.status(400).json({
        message:
          "All fields (login, name, passwd, email, role, timezone) are required.",
      });
    }
    const client = await req.app.locals.dbEngenhariaTest;
    const db = client.db("PreEngenharia");
    const collection = db.collection("Schedule");

    if (reportType === "onlineDevices") {
      await collection.insertOne({});
    } else if (reportType === "machineLHistory") {
      await collection.insertOne({});
    } else {
      await collection.insertOne({});
    }

    // Resposta de sucesso
    res.status(201).json({ message: "User registered successfully." });
    appendLog(req.login, `Registered new user: ${login}`);
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
