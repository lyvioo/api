const express = require("express");
require("newrelic");
const mongoose = require("mongoose");
const cors = require("cors");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
require("dotenv").config();
const { connectPreEngenharia } = require("./dbconnection/preEngenhaira");
const { connect } = require("./dbconnection/querys");
const cookieParser = require("cookie-parser");
const { router: reportGenRouter } = require("./routes/reportGen");
const main = require("./emailServer/schedule").main;
const { addToScheduleCollection, connectToDatabase } = require('./emailServer/schedule');
const smtpConfigRoutes = require('./emailServer/smtpConfigRoutes');



const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://172.16.10.244:3010",
  "https://guwaro.domain",
  "http://guwaro.domain",
  "https://172.16.10.244",
  "http://172.16.10.244",
  "https://localhost",
  "http://localhost",
];
let dbEngenharia;

async function initializeDatabaseConnection() {
  if (!dbEngenharia) {
    await connectToDatabase();
  }
}


app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Import and use middlewares
//app.use(require("./middlewares/sanitizer"));
app.use(require("./middlewares/logRequest"));
app.use(require("./middlewares/checkUserAgent"));

// Use checkAPIKey middleware only for the /modules route
const checkAPIKey = require("./middlewares/checkAPIKey");
app.use("/modules", checkAPIKey);

// Definindo a rota POST para /update-settings
app.post('/MachineLHistory', async (req, res) => {
  try {
      await initializeDatabaseConnection(); // Garantindo a conexão com o banco de dados
      const data = req.body;

      await addToScheduleCollection(
          false, // isOnlineDevice
          true,  // isMachineLHistory
          data.email,
          data.scheduleTime,
          data.machineName,
          data.user,
          data.emailRecipient
      );

      res.status(200).send('Dados de MachineLHistory salvos com sucesso.');
  } catch (error) {
      console.error('Erro ao salvar dados de MachineLHistory:', error);
      res.status(500).send('Erro ao salvar os dados no banco de dados para MachineLHistory');
  }
});

app.post('/OnlineDevices', async (req, res) => {
  try {
      await initializeDatabaseConnection(); // Garantindo a conexão com o banco de dados
      const data = req.body;

      await addToScheduleCollection(
          true,  // isOnlineDevice
          false, // isMachineLHistory
          data.email,
          data.scheduleTime,
          null, // machineName não é necessário para OnlineDevices
          null, // user não é necessário para OnlineDevices
          data.emailRecipient
      );

      res.status(200).send('Dados de OnlineDevices salvos com sucesso.');
  } catch (error) {
      console.error('Erro ao salvar dados de OnlineDevices:', error);
      res.status(500).send('Erro ao salvar os dados no banco de dados para OnlineDevices');
  }
});

app.post('/UsersLogged', async (req, res) => {
  try {
      await initializeDatabaseConnection(); // Garantindo a conexão com o banco de dados
      const data = req.body;

      await addToScheduleCollection(
          false, // isOnlineDevice
          false, // isMachineLHistory
          data.email,
          data.scheduleTime,
          data.machineName,
          null, // user não é necessário para UsersLogged
          data.emailRecipient
      );

      res.status(200).send('Dados de UsersLogged salvos com sucesso.');
  } catch (error) {
      console.error('Erro ao salvar dados de UsersLogged:', error);
      res.status(500).send('Erro ao salvar os dados no banco de dados para UsersLogged');
  }
});


app.post('/execute-main', async (req, res) => {
  try {
      await main();
      res.status(200).send('Função main executada com sucesso.');
  } catch (error) {
      console.error('Erro ao executar a função main:', error);
      res.status(500).send('Erro ao executar a função main');
  }
});



// Import and use routes
app.use("/api/", reportGenRouter);
app.use("/api/smtp-config", require("./routes/smtpConfigRoutes"));


app.use("/api/register-device", require("./routes/deviceRegistre"));
app.use("/api/metrics", require("./routes/metrics"));
app.use("/api/scan-devices", require("./routes/scanDevices"));
app.use("/api/ad-config", require("./routes/updateAD"));
app.use("/api/commands", require("./routes/deviceCommands"));
app.use("/api/send-command", require("./routes/sendCommand"));
app.use("/api/modules", require("./routes/modules"));
app.use("/api/login", require("./routes/login"));
app.use("/api/logout", require("./routes/logout"));
app.use("/api/tageditor", require("./routes/tageditor"));
app.use("/api/register", require("./routes/usercad"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/history", require("./routes/history"));
app.use("/api/reporton", require("./routes/reporton"));
app.use("/api/cpuhistory", require("./routes/cpuHistory"));
app.use("/api/ramhistory", require("./routes/ramHistory"));
app.use("/api/processeshistory", require("./routes/processesHistory"));
app.use("/api/TotalHdHistory", require("./routes/TotalHdHistory"));
app.use("/api/FreeHdHistory", require("./routes/FreeHdHistory"));
app.use("/api/TableDisk", require("./routes/TableDisk"));
app.use("/api/TotalSO", require("./routes/TotalSO"));
app.use("/api/usersReport", require("./routes/usersReport"));
app.use("/api/hostnames", require("./routes/hostnames"));

app.use("/api/", require("./routes/imageUpload"));
app.use("/api/", require("./routes/platformLogs"));
app.use("/api/", require("./routes/netScanConfig"));
app.use("/api/", require("./routes/netScan"));
app.use("/api/", require("./routes/scheduleScan"));
app.use("/api/", require("./routes/sysAdmin"));
app.use("/api/iwr00001", require("./routes/wr00001"));
app.use("/api/iwr00002", require("./routes/wr00002"));
app.use("/api/iwr00003", require("./routes/wr00003"));
app.use("/api/iwr00004", require("./routes/wr00004"));
app.use("/api/iwr00005", require("./routes/wr00005"));
app.use("/api/iwr00007", require("./routes/wr00007"));
app.use("/api/iwr00008", require("./routes/wr00008"));
app.use("/api/iwr00009", require("./routes/wr00009"));
app.use("/api/iwr00010", require("./routes/wr00010"));
app.use("/api/iwr00011", require("./routes/wr00011"));
app.use("/api/iwr00012", require("./routes/wr00012"));
app.use("/api/iwr00013", require("./routes/wr00013"));
app.use("/api/iwr00014", require("./routes/wr00014"));
app.use("/api/iwr00015", require("./routes/wr00015"));
app.use("/api/iwr00016", require("./routes/wr00016"));
app.use("/api/iwr00018", require("./routes/wr00018"));
app.use("/api/iwr00017", require("./routes/wr00017"));
app.use("/api/iwr00019", require("./routes/wr00019"));
app.use("/api/iwr00020", require("./routes/wr00020"));
app.use("/api/iwr00021", require("./routes/wr00021"));
app.use("/api/iwr00022", require("./routes/wr00022"));

app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/usersAppearances", require("./routes/usersAppearances"));
app.use("/api/users", require("./routes/users"));
app.use("/api/commonprocess", require("./routes/commonprocess"));
app.use("/api/HardwareInfo", require("./routes/HardwareInfo"));
app.use("/api/processNeverSaw", require("./routes/processNeverSaw"));

app.set("trust proxy", true);

const dbURL = process.env.DBQUERYS;
app.locals.dbQuerys = connect(dbURL);

const dbURL2 = process.env.DBENGENHARIA;
app.locals.dbEngenhariaTest = connectPreEngenharia(dbURL2);

// Configuração do cluster
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Worker ${process.pid} started server on port ${port}`);
  });
}

//main().catch(console.error);