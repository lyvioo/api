const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const { generateOnlineDevicesReportData } = require("../routes/reportGen");
const generatePDF = require("../services/pdfServices");
const pdfsDir = "C:/Users/User/Downloads/authentication-api/pdfs";
const scheduleTime = "57 14 * * *"; // Agendamento de dispositivos online
const emailRecipient = "romulolyvio@gmail.com"; // Destinatário do e-mail
const machineName = "TV02"; // Nome da máquina para users logged
const userLoggedScheduleTime = "57 14 * * *"; // Horário de agendamento para users logged
const UserMachineLHistory = "romulolyvio@gmail.com"; // usuário para MachineLHistory
const machineLHistoryScheduleTime = "57 14 * * *"; // agendamento para MachineLHistory
const uri =
  "mongodb://devs:qwert12345@172.16.10.244:27018/?authMechanism=DEFAULT";
const client = new MongoClient(uri);

let dbEngenharia;

async function connectToDatabase() {
  await client.connect();
  dbEngenharia = client.db("PreEngenharia");
  return dbEngenharia;
}

async function addToScheduleCollection(
  isOnlineDevice,
  isMachineLHistory,
  email,
  scheduleTime,
  machineName = null,
  user = null,
  emailRecipient = null
) {
  try {
    const scheduleCollection = dbEngenharia.collection("Schedule");
    let query = {};
    let updateField = {};

    if (isOnlineDevice) {
      query = {
        "OnlineDevices.email": email,
        "OnlineDevices.schedule": scheduleTime,
        "OnlineDevices.emailRecipient": emailRecipient
      };
      updateField = {
        $push: {
          OnlineDevices: {
            email: email,
            schedule: scheduleTime,
            emailRecipient: emailRecipient
          },
        },
      };
    } else if (isMachineLHistory) {
      query = {
        "MachineLHistory.user": user,
        "MachineLHistory.email": email,
        "MachineLHistory.schedule": scheduleTime,
        "MachineLHistory.hostname": machineName,
        "MachineLHistory.emailRecipient": emailRecipient
      };
      updateField = {
        $push: {
          MachineLHistory: {
            user: user,
            email: email,
            schedule: scheduleTime,
            hostname: machineName,
            emailRecipient: emailRecipient
          },
        },
      };
    } else {
      query = {
        "UsersLogged.email": email,
        "UsersLogged.schedule": scheduleTime,
        "UsersLogged.machine": machineName,
        "UsersLogged.emailRecipient": emailRecipient
      };
      updateField = {
        $push: {
          UsersLogged: {
            email: email,
            schedule: scheduleTime,
            machine: machineName,
            emailRecipient: emailRecipient
          },
        },
      };
    }

    // Verifica se já existe um agendamento similar
    const existingSchedule = await scheduleCollection.findOne(query);
    if (existingSchedule) {
      console.log('Um agendamento similar já existe e não será criado um novo.');
      return;
    }

    await scheduleCollection.updateOne({}, updateField, { upsert: true });
    console.log('Dados atualizados na coleção "Schedule".');
  } catch (error) {
    console.error('Erro ao atualizar dados na coleção "Schedule":', error);
  }
}




// Configuração do servidor SMTP
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "romulolyvio@gmail.com",
    pass: "bqxy safs fmns hgvr",
  },
});

function sendEmail(pdfPath) {
  fs.readFile(pdfPath, (err, data) => {
    if (err) {
      console.error("Erro ao ler o arquivo PDF:", err);
      return;
    }
    // Configuração do email remetente
    let mailOptions = {
      from: '"Sistema DataDike" <romulolyvio@gmail.com>',
      to: emailRecipient,
      subject: "Relatório Agendado",
      text: "Relatório Solicitado em anexo.",
      attachments: [
        {
          filename: path.basename(pdfPath),
          content: data,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erro ao enviar e-mail:", error);
        return;
      }
      console.log("Mensagem enviada: %s", info.messageId);
    });
  });
}

async function generateAndSendPDF(dbEngenharia) {
  try {
    const { reportData, data } = await generateOnlineDevicesReportData(
      dbEngenharia
    );
    const filePath = await generatePDF(reportData, data, dbEngenharia);

    sendEmail(filePath);
  } catch (error) {
    console.error("Erro ao gerar ou enviar PDF:", error);
  }
}

async function generateAndSendUserLoggedPDF(dbEngenharia, machine) {
  try {
    const collection = dbEngenharia.collection("usersReport");
    const query = { _id: "consolidatedLogins" };
    const data = await collection.findOne(query);

    if (data && data[machine]) {
      const machineData = { usersLogged: data[machine] };
      const reportData = {
        generatedDate: new Date().toLocaleDateString(),
        generatedTime: new Date().toLocaleTimeString(),
        exportedBy: "AutomatedDataDike",
        reportName: "REPORT USERS LOGGED FOR MACHINE " + machine,
      };

      const filePath = await generatePDF(reportData, machineData);

      sendEmail(filePath);
    } else {
      console.error(
        "Dados não encontrados para a máquina especificada:",
        machine
      );
    }
  } catch (error) {
    console.error("Erro ao gerar ou enviar PDF de usuários logados:", error);
  }
}

async function generateAndSendMachineLHistoryPDF(dbEngenharia, user) {
  try {
    const collection = dbEngenharia.collection("usersAppearances");
    const query = { documentId: "userLoginsList" };
    const document = await collection.findOne(query);

    if (document && document.userLogins && document.userLogins[user]) {
      let machineLHistory = [];
      const userLogins = document.userLogins[user];

      for (const machine in userLogins) {
        if (userLogins.hasOwnProperty(machine)) {
          userLogins[machine].forEach((dateTime) => {
            machineLHistory.push({
              user: user,
              machine: machine,
              dateTime: dateTime,
            });
          });
        }
      }

      const reportData = {
        generatedDate: new Date().toLocaleDateString(),
        generatedTime: new Date().toLocaleTimeString(),
        exportedBy: "AutomatedDataDike",
        reportName: `REPORT MACHINE LOGON HISTORY FOR USER ${user}`,
      };
      const filePath = await generatePDF(reportData, { machineLHistory });

      sendEmail(filePath);
    }
  } catch (error) {
    console.error("Erro ao gerar ou enviar PDF do histórico de logins:", error);
  }
}

async function main() {
  try {
    // Conecta ao banco de dados
    await connectToDatabase();

    // Adiciona agendamento para dispositivos online
    await addToScheduleCollection(true, false, emailRecipient, scheduleTime);

    // Adiciona agendamento para usuários logados
    await addToScheduleCollection(
      false,
      false,
      emailRecipient,
      userLoggedScheduleTime,
      machineName
    );

    // Adiciona agendamento para histórico de logins da máquina
    await addToScheduleCollection(
      false,
      true,
      emailRecipient,
      machineLHistoryScheduleTime,
      machineName,
      UserMachineLHistory
    );

    // Itera sobre as máquinas para adicionar os agendamentos
    const scheduleCollection = dbEngenharia.collection("Schedule");
    const document = await scheduleCollection.findOne({
      documentId: "userLoginsList",
    });

    if (document && document.userLogins) {
      for (const machine in document.userLogins[UserMachineLHistory]) {
        if (document.userLogins[UserMachineLHistory].hasOwnProperty(machine)) {
          await iterateMachines(
            true,
            emailRecipient,
            machineLHistoryScheduleTime,
            UserMachineLHistory
          );
        }
      }
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}

// Agendamento para envio do relatório de dispositivos online
/*schedule.scheduleJob(scheduleTime, async () => {
  try {
    await connectToDatabase();
    await generateAndSendPDF(dbEngenharia);
  } catch (error) {
    console.error(error);
  }
});

// Agendamento para envio do relatório de usuários logados
schedule.scheduleJob(userLoggedScheduleTime, async () => {
  try {
    await connectToDatabase();
    await generateAndSendUserLoggedPDF(dbEngenharia, machineName);
  } catch (error) {
    console.error(error);
  }
});

// Agendamento para envio do relatório de histórico de logins da máquina
schedule.scheduleJob(machineLHistoryScheduleTime, async () => {
  try {
    await connectToDatabase();
    await generateAndSendMachineLHistoryPDF(dbEngenharia, UserMachineLHistory);
  } catch (error) {
    console.error(error);
  }
});

process.on("SIGINT", async () => {
  console.log("Fechando conexão com o banco de dados...");
  await client.close();
  process.exit();
});
*/
module.exports = { addToScheduleCollection, connectToDatabase };
