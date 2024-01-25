const footer = require("../pdfFooter/footer");

let currentPage = 1;
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

function addPageIfRequired(doc, currentY, entryHeight, startX, headers, columnWidths, horizontalPadding, verticalPadding) {
    if (currentY + entryHeight > doc.page.height - doc.page.margins.bottom - 15) { // 15 é o espaço para o rodapé
        footer(doc, currentPage, totalPages);

        doc.addPage();
        currentPage++;

        currentY = doc.page.margins.top;
        currentY = addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding);

        doc.fontSize(10).font("Helvetica");
    }
    return currentY;
}

function calculateTotalPages(doc, machineLHistory, lineHeight, verticalPadding, pageHeight, pageMargins) {
    let currentY = 0;
    let totalPages = 1;

    machineLHistory.forEach(login => {
        const entryHeight = calculateEntryHeight(lineHeight, verticalPadding);
        if (currentY + entryHeight > pageHeight - pageMargins.bottom) {
            currentY = pageMargins.top;
            totalPages++;
        }
        currentY += entryHeight;
    });

    return totalPages;
}

function drawTableMachineLHistory(doc, machineLHistory) {
    const blue = "#506fd9";
    const startX = 30;
    const startY = 200;
    const endX = doc.page.width - doc.page.margins.right;
    const pageWidth = endX - startX;
    let currentY = startY;
    const horizontalPadding = 10;
    const verticalPadding = 4;
    const lineHeight = doc.currentLineHeight() + verticalPadding;

    totalPages = calculateTotalPages(doc, machineLHistory, lineHeight, verticalPadding, doc.page.height, doc.page.margins);

    const columnWidths = { user: pageWidth * 0.30, machine: pageWidth * 0.35, dateTime: pageWidth * 0.35 };
    const headers = { user: 'USER', machine: 'HOSTNAME', dateTime: 'DATE TIME' };

    doc.fontSize(10).font("Helvetica-Bold").text("LIST", startX + horizontalPadding, startY - lineHeight);
    currentY += lineHeight;

    currentY = addHeaders(doc, startX, currentY, headers, columnWidths, horizontalPadding, verticalPadding);

    doc.fontSize(10).font("Helvetica");
    const colors = { even: '#f3f3f2', odd: 'white' };

    machineLHistory.forEach((entry, index) => {
        const entryHeight = calculateEntryHeight(lineHeight, verticalPadding);

        currentY = addPageIfRequired(doc, currentY, entryHeight, startX, headers, columnWidths, horizontalPadding, verticalPadding);

        const fillColor = index % 2 === 0 ? colors.even : colors.odd;
        doc.rect(startX, currentY, pageWidth, entryHeight).fill(fillColor);

        doc.fillColor('black');
        const cellMiddleY = currentY + (entryHeight / 2);

        doc.text(entry.user, startX + horizontalPadding, cellMiddleY, {
            width: columnWidths.user - (horizontalPadding * 2),
            align: 'left',
            baseline: 'middle'
        });

        doc.text(entry.machine, startX + columnWidths.user + horizontalPadding, cellMiddleY, {
            width: columnWidths.machine - (horizontalPadding * 2),
            align: 'left',
            baseline: 'middle'
        });

        doc.text(entry.dateTime, startX + columnWidths.user + columnWidths.machine + horizontalPadding, cellMiddleY, {
            width: columnWidths.dateTime - (horizontalPadding * 2),
            align: 'left',
            baseline: 'middle'
        });

        currentY += entryHeight;
    });

    doc.fillColor('black');

    doc.strokeColor(blue).dash(5, { space: 4 });

    const endReportY = currentY + lineHeight;

    doc.fontSize(10)
        .font("Helvetica-Bold")
        .text("END REPORT", startX, endReportY)
        .moveTo(startX, endReportY + lineHeight)
        .lineTo(endX, endReportY + lineHeight)
        .dash(5, { space: 4 })
        .lineWidth(3)
        .stroke()
        .strokeColor(blue)

    doc.undash().strokeColor('black');

    footer(doc, currentPage, totalPages);
}

module.exports = drawTableMachineLHistory;
