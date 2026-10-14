import JSZip from "jszip";

// The HTML converter ignores cell padding. Store caption insets as native Word
// cell margins (twips) so Word preserves the spacing used by our templates.
export async function preserveDocxCaptionPadding(document: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(document);
  const part = zip.file("word/document.xml");
  if (!part) throw new Error("Generated Word document is missing its document content.");
  const xml = await part.async("string");
  let nextCellIsCaptionDetails = false;
  const padded = xml.replace(/<w:tc>[\s\S]*?<\/w:tc>/g, (cell) => {
    const parties = cell.includes("In the Matter of the Marriage of");
    const details = nextCellIsCaptionDetails;
    nextCellIsCaptionDetails = parties;
    if (!parties && !details) return cell;
    const margins = `<w:tcMar><w:top w:w="360" w:type="dxa"/><w:bottom w:w="360" w:type="dxa"/><w:left w:w="${parties ? 0 : 280}" w:type="dxa"/><w:right w:w="${parties ? 240 : 0}" w:type="dxa"/></w:tcMar>`;
    return cell.replace(/<w:tcPr\/>|<w:tcPr>[\s\S]*?<\/w:tcPr>/, (properties) => {
      const clean = properties.replace(/<w:tcMar>[\s\S]*?<\/w:tcMar>/g, "");
      return clean === "<w:tcPr/>" ? `<w:tcPr>${margins}</w:tcPr>` : clean.replace("</w:tcPr>", `${margins}</w:tcPr>`);
    });
  });
  // Some Word readers infer a narrow cell when tcW is absent, even though
  // the table grid spans the page. Give each court-heading cell its full width.
  const headings = padded.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (table) => {
    if (!table.includes("STATE OF UTAH") || table.includes("In the Matter of the Marriage of")) return table;
    const width = table.match(/<w:tblW[^>]*w:w="(\d+)"/)?.[1];
    if (!width) return table;
    return table
      // Default Word table padding and paragraph spacing add a blank-looking
      // gap between these rows. Keep two rows with compact native spacing.
      .replace(/<w:tblCellMar>[\s\S]*?<\/w:tblCellMar>/, '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>')
      .replace(/<w:spacing[^>]*\/>/g, '<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="exact"/>')
      .replace(/<w:tc>[\s\S]*?<\/w:tc>/g, (cell) => {
        if (!cell.includes("STATE OF UTAH")) return cell;
        return cell.replace(/<w:tcPr\/>|<w:tcPr>[\s\S]*?<\/w:tcPr>/, (properties) => {
          const margins = '<w:tcMar><w:bottom w:w="240" w:type="dxa"/></w:tcMar>';
          const clean = properties.replace(/<w:tcMar>[\s\S]*?<\/w:tcMar>/g, "");
          return clean === "<w:tcPr/>" ? `<w:tcPr>${margins}</w:tcPr>` : clean.replace("</w:tcPr>", `${margins}</w:tcPr>`);
        });
      })
      .replace(/<w:tcPr\/>|<w:tcPr>[\s\S]*?<\/w:tcPr>/g, (properties) => {
      const clean = properties.replace(/<w:tcW[^>]*\/>/g, "");
      const cellWidth = `<w:tcW w:w="${width}" w:type="dxa"/>`;
      return clean === "<w:tcPr/>" ? `<w:tcPr>${cellWidth}</w:tcPr>` : clean.replace("</w:tcPr>", `${cellWidth}</w:tcPr>`);
    });
  });
  // Lock the caption's two columns in Word as well as HTML. Otherwise Word
  // can resize the parties column to fit the longer order title on the right.
  const captions = headings.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (table) => {
    if (!table.includes("In the Matter of the Marriage of")) return table;
    const width = Number(table.match(/<w:tblW[^>]*w:w="(\d+)"/)?.[1]);
    if (!width) return table;
    const half = Math.floor(width / 2);
    return table
      .replace(/<w:tblPr>[\s\S]*?<\/w:tblPr>/, (properties) =>
        properties.replace(/<w:tblLayout[^>]*\/>/g, "").replace("</w:tblPr>", '<w:tblLayout w:type="fixed"/></w:tblPr>')
      )
      .replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/, `<w:tblGrid><w:gridCol w:w="${half}"/><w:gridCol w:w="${width - half}"/></w:tblGrid>`)
      .replace(/<w:tcPr>[\s\S]*?<\/w:tcPr>/g, (properties) =>
        properties.replace(/<w:tcW[^>]*\/>/g, "").replace("</w:tcPr>", `<w:tcW w:w="${half}" w:type="dxa"/></w:tcPr>`)
      );
  });
  // HTML margin-top is lost by the converter. Apply the caption gap to the
  // first body paragraph using native Word spacing, without a spacer paragraph.
  let captionSeen = false;
  let bodySpaced = false;
  const spaced = captions.replace(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p>[\s\S]*?<\/w:p>/g, (block) => {
    if (block.startsWith("<w:tbl>")) {
      if (block.includes("In the Matter of the Marriage of")) captionSeen = true;
      return block;
    }
    if (!captionSeen || bodySpaced || !block.includes("<w:t")) return block;
    bodySpaced = true;
    return block.replace(/<w:spacing([^>]*)\/>/, (_tag, attributes: string) =>
      `<w:spacing${attributes.replace(/\s+w:before="[^"]*"/g, "")} w:before="240"/>`
    );
  });
  zip.file("word/document.xml", spaced);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
