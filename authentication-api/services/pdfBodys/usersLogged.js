const footer = require("../pdfFooter/footer");
const { incrementPageCount, getCurrentPage, resetPageCount } = require('../pageCount/pageCount');


let totalPages = 1;

function addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding) {
    Object.keys(headers).forEach((key, index) => {
        let headerX = startX + (key !== 'user' ? Object.values(columnWidths).slice(0, index).reduce((a, b) => a + b, 0) : 0);
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


function addPageIfRequired(doc, currentY, lineHeight, startX, headers, columnWidths, horizontalPadding, verticalPadding) {
  if (currentY + lineHeight > doc.page.height - doc.page.margins.bottom - 15) {
      footer(doc, getCurrentPage(), totalPages);

      doc.addPage();
      incrementPageCount();

      currentY = doc.page.margins.top;
      addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding);
      return doc.page.margins.top;
  }
  return currentY;
}


function calculateTotalPages(doc, usersLogged, lineHeight, verticalPadding, pageHeight, pageMargins, startX, headers, columnWidths, horizontalPadding, startY) {
  let tempCurrentY = startY;
  let tempTotalPages = 1;

  usersLogged.forEach(() => {
      const entryHeight = calculateEntryHeight(lineHeight, verticalPadding);
      if (tempCurrentY + entryHeight > pageHeight - pageMargins.bottom - 15) { // Considerando o espaço para o rodapé
          tempTotalPages++;
          tempCurrentY = pageMargins.top; // Reinicia a altura Y para a nova página
      }
      tempCurrentY += entryHeight; // Adiciona a altura da entrada atual ao Y temporário
  });

  return tempTotalPages;
}


function drawTableUsersLogged(doc, usersLogged) {
  resetPageCount();
    const blue = "#506fd9";
    const startX = 30;
    const startY = 200;
    const endX = doc.page.width - doc.page.margins.right;
    const pageWidth = endX - startX;
    let currentY = startY;
    const horizontalPadding = 10;
    const verticalPadding = 4;
    const lineHeight = doc.currentLineHeight() + verticalPadding;

    const columnWidths = { user: pageWidth * 0.35, dateTime: pageWidth * 0.25};
    const headers = { user: 'USER', dateTime: 'DATE TIME' };

    totalPages = calculateTotalPages(doc, usersLogged, lineHeight, verticalPadding, doc.page.height, doc.page.margins, startX, headers, columnWidths, horizontalPadding, startY);

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

      doc.text(login.user, startX + horizontalPadding, cellMiddleY, {
          width: columnWidths.user - (horizontalPadding * 2),
          align: 'left',
          baseline: 'middle'
      });

      doc.text(login.dateTime, startX + columnWidths.user + horizontalPadding, cellMiddleY, {
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

      footer(doc, getCurrentPage(), totalPages); 
    }

   module.exports = drawTableUsersLogged