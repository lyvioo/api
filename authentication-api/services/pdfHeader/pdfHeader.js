const path = require('path');
const companyLogo = path.join(__dirname, '../../src/logo/datadike.jpg');

async function getClientLogo(dbEngenharia) {
  try {
      const collection = dbEngenharia.collection('Logo');

      const logoDocument = await collection.findOne({});

      if (logoDocument && logoDocument.image) {
          return Buffer.from(logoDocument.image.buffer, 'binary');
      }
      return null;
  } catch (error) {
      console.error('Error fetching client logo:', error);
      return null;
  }
}


function appendAmPmSuffix(time12h) {
    const [hours, ] = time12h.split(":");
    const amPm = parseInt(hours, 10) >= 12 ? 'PM' : 'AM';
    return `${time12h} ${amPm}`;
}

async function generateReportHeader(doc, reportData, dbEngenharia) {
    const barWidth = 20;
    const barHeight = 60;
    const barColor = "#506fd9";
    const barXPosition = 30; 
    const barYPosition = 10; 
    const barMidPosition = barYPosition + (barHeight / 2); 

    doc.save()
       .rect(barXPosition, 40, barWidth, barHeight)
       .fill(barColor)
       .restore();

    const clientLogo = await getClientLogo(dbEngenharia);
    if (clientLogo) {
        const logoWidth = 150;
        const logoHeight = 150;
        const pageWidth = doc.page.width;
        const docMargins = doc.page.margins;
        const marginRight = 30;
        const logoXPosition = pageWidth - docMargins.right - marginRight - logoWidth;
        const logoYPosition = barMidPosition - (90 / 2);

        doc.image(clientLogo, logoXPosition, logoYPosition, { width: logoWidth, height: logoHeight });
    }

    const logoXPosition = barXPosition + barWidth + 10;
    const logoHeight = -10; 
    const logoYPosition = barMidPosition - (logoHeight / 2);

    doc.image(companyLogo, logoXPosition, logoYPosition, { width: 110 });

    const reportGeneratedXPosition = logoXPosition + 110 - 5; 
    const reportGeneratedYPosition = barYPosition + (barHeight / 2) - (doc.currentLineHeight() / 2);
    doc.fontSize(12)
       .font("Helvetica-Bold")
       .text("REPORT GENERATED", reportGeneratedXPosition, reportGeneratedYPosition);

    const detailsXPosition = reportGeneratedXPosition + 10;
    let currentYPosition = reportGeneratedYPosition + 20;

    const labelsAndValues = [
        { label: "Date:", value: reportData.generatedDate },
        { label: "Hour:", value: appendAmPmSuffix(reportData.generatedTime) },
        { label: "Exported by:", value: reportData.exportedBy },
    ];

    labelsAndValues.forEach((item) => {
        const labelWidth = doc.widthOfString(item.label);
        doc.text(item.label, detailsXPosition, currentYPosition);
        doc.font("Helvetica")
           .text(item.value, detailsXPosition + labelWidth + 1, currentYPosition);
        currentYPosition += 20;
        doc.font("Helvetica-Bold");
    });

    doc.fontSize(18).font("Helvetica-Bold").text(reportData.reportName, 45, 120);
    doc.fontSize(12).font("Helvetica-Bold").text("STATUS SUMMARY", 55, 140);
    doc.font("Helvetica")
       .text(`Report generated on ${reportData.generatedDate} at ${reportData.generatedTime}`, 65, 155);

    const lineWidth = 3;
    const lineStartYPosition = 170;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc.strokeColor("#506fd9")
       .lineWidth(lineWidth)
       .moveTo(barXPosition, lineStartYPosition)
       .lineTo(pageWidth + doc.page.margins.left, lineStartYPosition)
       .dash(5, { space: 4 })
       .stroke();
}

module.exports = generateReportHeader;
