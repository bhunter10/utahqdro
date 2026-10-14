const googleExportStyles = {
  headingLine: "margin: 0; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; text-align: center; color: #000000;",
  captionGap: "margin: 0; padding: 0; height: 12pt; line-height: 12pt; font-family: Times New Roman; font-size: 12pt; color: #000000;"
};

export function prepareGoogleDocumentHtml(html: string) {
  // Drive's HTML importer drops spacing before a paragraph following a table.
  // One 12pt paragraph preserves that gap; clear the following top margin so
  // importers that honor it do not double the spacing.
  const headings = html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    if (table.includes("In the Matter of the Marriage of")) {
      return table.replace(/<table\b[^>]*>/i, (opening) => opening.replace(/margin:\s*0 0 12pt;?/i, "margin: 0;"));
    }
    if (!table.includes("STATE OF UTAH") || table.includes("In the Matter of the Marriage of") || table.includes(`<p style="${googleExportStyles.headingLine}">`)) return table;
    return table
      .replace(/margin:\s*12pt 0;?/i, "margin: 0;")
      .replace(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi, (_cell, attributes: string, text: string) => {
        // Google Docs already inserts a paragraph between these tables.
        // Extra bottom padding doubles the visible gap below STATE OF UTAH.
        const style = "width: 100%; border: none; padding: 0; text-align: center; vertical-align: top;";
        const clean = attributes.replace(/style="[^"]*"/i, "");
        return `<td${clean} style="${style}"><p style="${googleExportStyles.headingLine}">${text.trim()}</p></td>`;
      });
  });
  return headings.replace(/(<\/table>)\s*(<p\b[^>]*>)(\s*(?:WHEREAS this Court|COMES NOW))/i,
    (_match, table: string, paragraph: string, text: string) => {
      const bodyParagraph = paragraph.replace(/margin-top:\s*12pt;?/i, "margin-top: 0;");
      return `${table}<p style="${googleExportStyles.captionGap}">&nbsp;</p>${bodyParagraph}${text}`;
    });
}
