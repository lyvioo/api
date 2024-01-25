const express = require("express");
const router = express.Router();
const generatePDF = require("../services/pdfServices");
const tokenCheck = require("../middlewares/tokenCheck");

router.get("/generate-pdf/online-devices", async (req, res) => {
    try {
        const reportData = {
            generatedDate: new Date().toLocaleDateString(),
            generatedTime: new Date().toLocaleTimeString(),
            exportedBy: req.login, // ou a lógica apropriada para obter o usuário
            reportName: "REPORT OF ALL MACHINES ONLINE",
        };
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('OnlineSystems');

        const data = await collection.findOne({ _id: "consolidated_results" });
        console.log("dado que a api coletou", data)

        const filePath = await generatePDF(reportData, data, req);
        res.download(filePath, 'report.pdf', (err) => {
            if (err) {
                // Tratar o erro ao enviar o arquivo, se necessário
                console.error("Error sending PDF:", err);
                res.status(500).json({ message: "Error sending PDF" });
            }
        });
    } catch (err) {
        console.error("Error generating PDF:", err);
        res.status(500).json({ message: "Error generating PDF" });
    }
});

router.get("/generate-pdf/users-logged/:machine", async (req, res) => {
    const machine = req.params.machine;
    try {
        const reportData = {
            generatedDate: new Date().toLocaleDateString(),
            generatedTime: new Date().toLocaleTimeString(),
            exportedBy: req.login, // ou a lógica apropriada para obter o usuário
            reportName: "REPORT USERS LOGGED FOR MACHINE " + machine,
        };
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('usersReport');

        // Constrói a chave de consulta dinâmica
        const query = { _id: "consolidatedLogins" };
        const data = await collection.findOne(query);

        if (data && data[machine]) {
            // Utiliza os dados da máquina específica
            const machineData = { usersLogged: data[machine]};
            console.log("Dados coletados para a máquina:", machineData);

            // Gera o PDF com os dados da máquina específica
            const filePath = await generatePDF(reportData, machineData, req);

            // Modifica aqui para enviar o arquivo PDF diretamente
            res.download(filePath, 'user_report.pdf', (err) => {
                if (err) {
                    // Tratar o erro ao enviar o arquivo, se necessário
                    console.error("Error sending PDF:", err);
                    res.status(500).json({ message: "Error sending PDF" });
                }
            });
        } else {
            res.status(404).json({ message: "Dados não encontrados para a máquina especificada" });
        }
    } catch (err) {
        console.error("Error generating PDF:", err);
        res.status(500).json({ message: "Error generating PDF" });
    }
});

router.get("/generate-pdf/machine-lhistory/:user", async (req, res) => {
    const user = req.params.user;
    try {
        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('usersAppearances');

        // Consulta para recuperar o documento com os registros de login
        const query = { documentId: "userLoginsList" };
        const document = await collection.findOne(query);

        if (document && document.userLogins && document.userLogins[user]) {
            // Extrai as datas de login para todas as máquinas associadas ao usuário
            const userLoginInfo = document.userLogins[user];
            let machineLHistory = [];

            for (const hostname in userLoginInfo) {
                if (userLoginInfo.hasOwnProperty(hostname)) {
                    const loginTimes = userLoginInfo[hostname];
                    const logins = loginTimes.map(dateTime => ({
                        hostname: hostname,
                        dateTime: dateTime
                    }));
                    machineLHistory = machineLHistory.concat(logins);
                }
            }

            // Prepara os dados para a geração do PDF
            const userData = { machineLHistory };
            console.log("Dados coletados para o usuário:", userData);

            // Dados para o cabeçalho do relatório
            const reportData = {
                generatedDate: new Date().toLocaleDateString(),
                generatedTime: new Date().toLocaleTimeString(),
                exportedBy: req.login, 
                reportName: "REPORT MACHINE LOGON HISTORY FOR " + user,
            };
            const filePath = await generatePDF(reportData, userData, req);

            // Envia o arquivo PDF
            res.download(filePath, 'user_report.pdf', (err) => {
                if (err) {
                    console.error("Error sending PDF:", err);
                    res.status(500).json({ message: "Error sending PDF" });
                }
            });
        } else {
            // Usuário não encontrado no documento
            res.status(404).json({ message: "Dados não encontrados para o usuário especificado" });
        }
    } catch (err) {
        console.error("Error generating PDF:", err);
        res.status(500).json({ message: "Error generating PDF" });
    }
});

async function generateOnlineDevicesReportData(dbEngenharia) {
    const collection = dbEngenharia.collection('OnlineSystems');

    const data = await collection.findOne({ _id: "consolidated_results" });

    const reportData = {
        generatedDate: new Date().toLocaleDateString(),
        generatedTime: new Date().toLocaleTimeString(),
        exportedBy: "AutomatedDataDike", 
        reportName: "REPORT OF ALL MACHINES ONLINE",
    };

    return { reportData, data };
}



module.exports = {
    router: router,
    generateOnlineDevicesReportData: generateOnlineDevicesReportData
};
