const footer = require("../pdfFooter/footer");

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

function calculateEntryHeight(system, lineHeight, verticalPadding) {
    const networkInfoLines = system.networkInfo.length;
    const tagsLines = system.tags ? system.tags.length : 1;
    return Math.max(networkInfoLines, tagsLines) * lineHeight + verticalPadding * 2;
}

function addPageIfRequired(doc, currentY, entryHeight, startX, headers, columnWidths, horizontalPadding, verticalPadding, currentPage, totalPages) {
  if (currentY + entryHeight > doc.page.height - doc.page.margins.bottom) {
      footer(doc, currentPage, totalPages); // Passando totalPages corretamente

      doc.addPage();
      currentPage++;

      currentY = doc.page.margins.top;
      currentY = addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding);
  }
  return { currentY, currentPage };
}

function calculateTotalPages(doc, systems, lineHeight, verticalPadding, pageHeight, pageMargins) {
  let currentY = pageMargins.top; // Inicia do topo da primeira página
  let totalPages = 1;

  systems.forEach(system => {
    const entryHeight = calculateEntryHeight(system, lineHeight, verticalPadding);
    if (currentY + entryHeight > pageHeight - pageMargins.bottom) {
      // Se a entrada não couber na página atual, adiciona uma nova página
      totalPages++;
      currentY = pageMargins.top + entryHeight; // Reinicia currentY para o topo da nova página e adiciona a altura da entrada
    } else {
      // Se couber, apenas adiciona a altura da entrada a currentY
      currentY += entryHeight;
    }
  });

  return totalPages;
}

function drawTableOnlineDevices(doc, systems) {
    const blue = "#506fd9";
    const startX = 30;
    const startY = 200;
    const endX = doc.page.width - doc.page.margins.right;
    const pageWidth = endX - startX;
    let currentY = startY;
    const horizontalPadding = 10;
    const verticalPadding = 4;
    const lineHeight = doc.currentLineHeight() + verticalPadding;
    let totalPages = calculateTotalPages(doc, systems, lineHeight, verticalPadding, doc.page.height, doc.page.margins);
    let currentPage = 1;


    const columnWidths = { hostname: pageWidth * 0.35, ip: pageWidth * 0.25, mac: pageWidth * 0.25, tags: pageWidth * 0.15 };
    const headers = { hostname: 'HOSTNAME', ip: 'IPs', mac: 'MACs', tags: 'TAGs' };

    doc.fontSize(10).font("Helvetica-Bold").text("LIST", startX + horizontalPadding, startY - lineHeight);
    currentY += lineHeight;

    currentY = addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding);

    doc.fontSize(10).font("Helvetica");
    const colors = { even: '#f3f3f2', odd: 'white' };

    systems.forEach((system, index) => {
        const networkInfoLines = system.networkInfo.length;
        const tagsLines = system.tags ? system.tags.length : 1;
        const entryHeight = calculateEntryHeight(system, lineHeight, verticalPadding);

        let result = addPageIfRequired(doc, currentY, entryHeight, startX, headers, columnWidths, horizontalPadding, verticalPadding, currentPage, totalPages);
        currentY = result.currentY;       
        currentPage = result.currentPage;

        const fillColor = index % 2 === 0 ? colors.even : colors.odd;
        doc.rect(startX, currentY, pageWidth, entryHeight).fill(fillColor);
        
        
      doc.fillColor('black');
  
      const cellMiddleY = currentY + (entryHeight / 2);
  
      doc.text(system.hostname, startX + horizontalPadding, cellMiddleY, {
        width: columnWidths.hostname - (horizontalPadding * 2),
        align: 'left',
        baseline: 'middle'
      });
  
      const ipStartY = cellMiddleY - ((networkInfoLines - 1) * lineHeight) / 2;
      system.networkInfo.forEach((info, lineIndex) => {
        doc.text(info.address, startX + columnWidths.hostname + horizontalPadding, ipStartY + (lineIndex * lineHeight), {
          width: columnWidths.ip - (horizontalPadding * 2),
          align: 'left',
          baseline: 'middle'
        });
  
        doc.text(info.mac, startX + columnWidths.hostname + columnWidths.ip + horizontalPadding, ipStartY + (lineIndex * lineHeight), {
          width: columnWidths.mac - (horizontalPadding * 2),
          align: 'left',
          baseline: 'middle'
        });
      });
  
      if (system.tags) {
        const tagsStartY = cellMiddleY - ((tagsLines - 1) * lineHeight) / 2;
        system.tags.forEach((tag, lineIndex) => {
          let tagName = Object.keys(tag)[0];
          doc.text(tagName, startX + columnWidths.hostname + columnWidths.ip + columnWidths.mac + horizontalPadding, tagsStartY + (lineIndex * lineHeight), {
            width: columnWidths.tags - (horizontalPadding * 2),
            align: 'left',
            baseline: 'middle'
          });
        });
      } else {
        doc.text("N/A", startX + columnWidths.hostname + columnWidths.ip + columnWidths.mac + horizontalPadding, cellMiddleY, {
          width: columnWidths.tags - (horizontalPadding * 2),
          align: 'left',
          baseline: 'middle'
        });
      }
  
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

   module.exports = drawTableOnlineDevices