const { page } = require("pdfkit");

function footer(doc, currentPage, totalPages) {
  const yPos = doc.page.height - doc.page.margins.bottom - 15;
  const pageWidth = doc.page.width;
  const numberText = `Page ${currentPage} of ${totalPages}`;
  const pageMargin = doc.page.margins.right + 50;

  // Calcula a largura do texto
  const textWidth = doc.widthOfString(numberText);

  // Calcula a posição x para o texto. Isso garante que o texto não ultrapasse a margem direita.
  const xPos = pageWidth - pageMargin- textWidth;

  doc.fontSize(10).font("Helvetica").fillColor("black")
      .text(numberText, xPos, yPos, {
          align: 'right'
      });
}

module.exports = footer;
