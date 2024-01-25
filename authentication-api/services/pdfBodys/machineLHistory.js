const footer = require("../pdfFooter/footer");

let currentPage = 1;
let totalPages = 1;

function addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding) {
    Object.keys(headers).forEach((key, index) => {
        let headerX = startX + (key !== 'hostname' ? Object.values(columnWidths).slice(0, index).reduce((a, b) => a + b, 0) : 0);
        doc.fontSize(10).font("Helvetica-Bold").fillColor('black').text(headers[key], headerX + horizontalPadding, currentY, {
            width: columnWidths[key] - (horizontalPadding * 2),
            align: 'left',
            baseline: 'middle'
        });
    });

    return currentY + doc.currentLineHeight() + verticalPadding;
}

function calculateEntryHeight(lineHeight, verticalPadding) {
  return lineHeight + verticalPadding * 2;
}


function addPageIfRequired(doc, currentY, entryHeight, startX, headers, columnWidths, horizontalPadding, verticalPadding) {
  // Verifique se há espaço suficiente para o conteúdo mais o rodapé
  if (currentY + entryHeight > doc.page.height - doc.page.margins.bottom - 15) { // 15 é o espaço para o rodapé
    footer(doc, currentPage, totalPages);

      // Adicione uma nova página
      doc.addPage();
      currentPage++;

      // Reinicie a posição Y e adicione os cabeçalhos na nova página
      currentY = doc.page.margins.top;
      currentY = addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding);

      doc.fontSize(10).font("Helvetica");
  }
  return currentY;
}

function calculateTotalPages(doc, usersLogged, lineHeight, verticalPadding, pageHeight, pageMargins) {
  let currentY = 0;
  let totalPages = 1; // Iniciar com 1 página

  usersLogged.forEach(login => {
      const entryHeight = calculateEntryHeight(lineHeight, verticalPadding);
      if (currentY + entryHeight > pageHeight - pageMargins.bottom) {
          currentY = pageMargins.top;
          totalPages++;
      }
      currentY += entryHeight;
  });

  return totalPages;
}

function drawTableMachineLHistory(doc, usersLogged) {
      const blue = "#506fd9";
    const startX = 30;
    const startY = 200;
    const endX = doc.page.width - doc.page.margins.right;
    const pageWidth = endX - startX;
    let currentY = startY;
    const horizontalPadding = 10;
    const verticalPadding = 4;
    const lineHeight = doc.currentLineHeight() + verticalPadding;

    totalPages = calculateTotalPages(doc, usersLogged, lineHeight, verticalPadding, doc.page.height, doc.page.margins);


    const columnWidths = { hostname: pageWidth * 0.35, dateTime: pageWidth * 0.25};
    const headers = { hostname: 'HOSTNAME', dateTime: 'DATE TIME' };

    doc.fontSize(10).font("Helvetica-Bold").text("LIST", startX + horizontalPadding, startY - lineHeight);
    currentY += lineHeight;

    currentY = addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding);

    doc.fontSize(10).font("Helvetica");
    const colors = { even: '#f3f3f2', odd: 'white' };

    usersLogged.forEach((login, index) => {
      const entryHeight = calculateEntryHeight(lineHeight, verticalPadding);

      currentY = addPageIfRequired(doc, currentY, entryHeight, startX, headers, columnWidths, horizontalPadding, verticalPadding);

      const fillColor = index % 2 === 0 ? colors.even : colors.odd;
      doc.rect(startX, currentY, pageWidth, entryHeight).fill(fillColor);
      
      doc.fillColor('black');
      const cellMiddleY = currentY + (entryHeight / 2);

      doc.text(login.hostname, startX + horizontalPadding, cellMiddleY, {
          width: columnWidths.hostname - (horizontalPadding * 2),
          align: 'left',
          baseline: 'middle'
      });

      doc.text(login.dateTime, startX + columnWidths.hostname + horizontalPadding, cellMiddleY, {
          width: columnWidths.dateTime - (horizontalPadding * 2),
          align: 'left',
          baseline: 'middle'
      });

      currentY += entryHeight;
  });
  
    doc.fillColor('black');
  
      // Define a cor do traço para azul e o estilo para tracejado
      doc.strokeColor(blue).dash(5, { space: 4 });
  
      // Posição Y para o "END REPORT" e a linha tracejada
      const endReportY = currentY + lineHeight;
  
      // Escreve "END REPORT" e desenha a linha tracejada
      doc.fontSize(10)
         .font("Helvetica-Bold")
         .text("END REPORT", startX, endReportY)
         .moveTo(startX, endReportY + lineHeight) // ajuste o Y conforme necessário
         .lineTo(endX, endReportY + lineHeight)   // ajuste o Y conforme necessário
         .dash(5, { space: 4 })
         .lineWidth(3)
         .stroke()
         .strokeColor(blue)

  
      // Reinicia o estilo do traço para sólido para o restante do documento
      doc.undash().strokeColor('black');

      footer(doc, currentPage, totalPages);
    }

   module.exports = drawTableMachineLHistory;