const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const pdfsPath = path.join(__dirname, "../pdfs");
const header = require("./pdfHeader/pdfHeader");
const onlineDevices = require("./pdfBodys/onlineDevices");
const usersLogged = require("./pdfBodys/usersLogged");
const machineLHistory = require("./pdfBodys/machineLHistory");
const footer = require("./pdfFooter/footer");

function generatePDFBody(doc, data) {
    if (data && Array.isArray(data.systems)) {
        onlineDevices(doc, data.systems);
    } else if (data && data.usersLogged && Array.isArray(data.usersLogged)) {
        usersLogged(doc, data.usersLogged);
    } else if (data && data.machineLHistory && Array.isArray(data.machineLHistory)) {
        // Chamada da função para gerar o PDF de histórico de máquinas
        machineLHistory(doc, data.machineLHistory);
    } else {
        throw new Error('Dados inválidos fornecidos');
    }
}


if (!fs.existsSync(pdfsPath)) {
    fs.mkdirSync(pdfsPath, { recursive: true });
}

async function generatePDF(reportData, data, dbEngenharia) {
    const fileName = `report-${Date.now()}.pdf`;
    const filePath = path.join(pdfsPath, fileName);

    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    await header(doc, reportData, dbEngenharia); 
    generatePDFBody(doc, data);

    const totalNumberOfPages = doc.bufferedPageRange().count;
    for (let i = 1; i < totalNumberOfPages; i++) {
        doc.switchToPage(i);
        footer(doc, i + 1, totalNumberOfPages);
    }

    doc.end();

    return new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(filePath));
        writeStream.on("error", (err) => reject(err));
    });
}

module.exports = generatePDF;
