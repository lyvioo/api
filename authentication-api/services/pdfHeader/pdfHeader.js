const companyLogo = "src/logo/datadike.jpg";

async function getClientLogo(req) {
    try {
      const dbEngenharia = await req.app.locals.dbEngenhariaTest;
      const db = dbEngenharia.db('frontConfig');
      const collection = db.collection('Logo');
  
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
  
  async function generateReportHeader(doc, reportData, req) {
      const barWidth = 20;
      const barHeight = 60;
      const barColor = "#506fd9";
      const barXPosition = 30; // A posição X onde a barra azul começa
      const barYPosition = 10; // A posição Y onde a barra azul começa
      const barMidPosition = barYPosition + (barHeight / 2); // Ponto médio da barra azul
    
    
      // Desenha a barra azul
      doc
        .save()
        .rect(barXPosition, 40, barWidth, barHeight,)
        .fill(barColor)
        .restore();
        
        const clientLogo = await getClientLogo(req);
        if (clientLogo) {
            const logoWidth = 150; // Largura da logo da bandeira
            const logoHeight = 150; // Altura da logo da bandeira (ajuste conforme necessário)
            const pageWidth = doc.page.width; // Largura total da página
            const docMargins = doc.page.margins; // Margens do documento
    
            // Posição X para alinhar a imagem à direita com a margem
            const marginRight = 30; // Margem à direita da imagem
            const logoXPosition = pageWidth - docMargins.right - marginRight - logoWidth;
    
            // Posição Y para centralizar a imagem verticalmente com o retângulo azul
            const logoYPosition = barMidPosition - (90 / 2);
    
            // Adiciona a imagem da bandeira ao PDF
            doc.image(clientLogo, logoXPosition, logoYPosition, { width: logoWidth, height: logoHeight });
        }
    
      // Logotipo
      const logoXPosition = barXPosition + barWidth + 10; // 10 pontos de espaço entre a barra e o logotipo
    
      const logoHeight = -10; // Substitua por a altura real do seu logotipo se for diferente
      const logoYPosition = barMidPosition - (logoHeight / 2);
    
      doc.image(companyLogo, logoXPosition, logoYPosition, { width: 110 });
    
      // Texto 'REPORT GENERATED'
      const reportGeneratedXPosition = logoXPosition + 110 - 5;   // A posição X do texto 'REPORT GENERATED'
    
      const reportGeneratedYPosition = barYPosition + (barHeight / 2) - (doc.currentLineHeight() / 2);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("REPORT GENERATED", reportGeneratedXPosition, reportGeneratedYPosition);
    
      // Outros detalhes
      const detailsXPosition = reportGeneratedXPosition + 10; // A posição X para os detalhes
      let currentYPosition = reportGeneratedYPosition + 20; // A posição Y inicial para os detalhes
    
      const labelsAndValues = [
        { label: "Date:", value: reportData.generatedDate },
        { label: "Hour:", value: reportData.generatedTime = appendAmPmSuffix(reportData.generatedTime)},
        { label: "Exported by:", value: reportData.exportedBy },
      ];
    
      labelsAndValues.forEach((item) => {
        const labelWidth = doc.widthOfString(item.label);
        doc.text(item.label, detailsXPosition, currentYPosition);
        doc
          .font("Helvetica")
          .text(item.value, detailsXPosition + labelWidth + 1, currentYPosition);
        currentYPosition += 20; // Incrementa para a próxima linha
        doc.font("Helvetica-Bold"); // Volta para o negrito para o próximo label
      });
    
      // Título do relatório e subtítulo
      doc.fontSize(18).font("Helvetica-Bold").text(reportData.reportName, 45, 120);
      doc.fontSize(12).font("Helvetica-Bold").text("STATUS SUMMARY", 55, 140);
      doc
        .font("Helvetica")
        .text(
          `Report generated on ${reportData.generatedDate} at ${reportData.generatedTime}`,
          65,
          155
        );
    
      // Linha tracejada alinhada com a barra azul
      const lineWidth = 3; // Espessura da linha tracejada
      const lineStartYPosition = 170; // Posição Y onde a linha tracejada começa
      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc
        .strokeColor("#506fd9")
        .lineWidth(lineWidth)
        .moveTo(barXPosition, lineStartYPosition) // Início alinhado com a barra azul
        .lineTo(pageWidth + doc.page.margins.left, lineStartYPosition)
        .dash(5, { space: 4 })
        .stroke();
    }


    module.exports = generateReportHeader;