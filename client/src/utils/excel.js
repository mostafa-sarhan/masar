// Builds and downloads `<fileName>_<timestamp>.xlsx`: a summary block on top, then the data table.
// exceljs is loaded on demand to keep it out of the main bundle.
export async function downloadReport({ fileName, sheetName, summary, columns, rows }) {
  const { default: ExcelJS } = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName, { views: [{ rightToLeft: true }] });

  summary.forEach((row) => sheet.addRow(row));
  sheet.addRow([]);

  const header = sheet.addRow(columns.map((c) => c.header));
  header.font = { bold: true };
  rows.forEach((row) => sheet.addRow(columns.map((c) => c.value(row))));
  sheet.columns.forEach((col) => (col.width = 18));

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  );
  const link = Object.assign(document.createElement("a"), { href: url, download: `${fileName}_${Date.now()}.xlsx` });
  link.click();
  URL.revokeObjectURL(url);
}
