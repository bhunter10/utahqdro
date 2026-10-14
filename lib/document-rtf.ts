import { parseDocument } from "htmlparser2";
import { isTag, type AnyNode, type Element } from "domhandler";

const pageWidth = 9360; // US Letter with one-inch margins, in twips.

function escapeRtf(text: string) {
  return text.replace(/\s+/g, " ").split("").map((character) => {
    if ("\\{}".includes(character)) return `\\${character}`;
    const code = character.charCodeAt(0);
    return code > 127 ? `\\u${code > 32767 ? code - 65536 : code}?` : character;
  }).join("");
}

function styles(element: Element): Record<string, string> {
  return Object.fromEntries((element.attribs.style || "").split(";").flatMap((entry) => {
    const colon = entry.indexOf(":");
    return colon < 0 ? [] : [[entry.slice(0, colon).trim(), entry.slice(colon + 1).trim().replace(/\s*!important/g, "")]];
  }));
}

function twips(value: string | undefined, fallback = 0) {
  if (!value) return fallback;
  const number = parseFloat(value);
  if (!Number.isFinite(number)) return fallback;
  if (value.endsWith("in")) return Math.round(number * 1440);
  if (value.endsWith("px")) return Math.round(number * 15);
  return Math.round(number * 20);
}

// RTF preserves editable text, basic typography, and table columns. Nested
// one-column signature tables become separate lines inside their outer cell.
export function documentHtmlToRtf(html: string) {
  const colors: string[] = [];
  function colorIndex(value: string | undefined) {
    const match = value?.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
    if (!match) return 0;
    const hex = match[1].length === 3 ? match[1].split("").map((digit) => digit + digit).join("") : match[1];
    const rgb = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    const color = `\\red${rgb[0]}\\green${rgb[1]}\\blue${rgb[2]};`;
    let index = colors.indexOf(color);
    if (index < 0) { index = colors.length; colors.push(color); }
    return index + 1;
  }

  function renderChildren(element: Element, inCell = false): string {
    return element.children.map((node) => render(node, inCell)).join("");
  }

  function rows(table: Element): Element[] {
    return table.children.flatMap((node) => !isTag(node) ? [] :
      node.name === "tr" ? [node] : ["tbody", "thead", "tfoot"].includes(node.name) ? rows(node) : []);
  }

  function textContent(node: AnyNode): string {
    if (node.type === "text") return node.data;
    return isTag(node) ? node.children.map(textContent).join("") : "";
  }

  function renderTable(table: Element, inCell: boolean): string {
    const tableRows = rows(table);
    if (inCell) return tableRows.map((row) => row.children.filter(isTag)
      .map((cell) => renderChildren(cell, true)).join("\\tab ")).join("\\line ");
    const columns = Math.max(1, ...tableRows.map((row) => row.children.filter(isTag)
      .reduce((sum, cell) => sum + (Number(cell.attribs.colspan) || 1), 0)));
    return tableRows.map((row) => {
      const cells = row.children.filter(isTag);
      let edge = 0;
      const definitions = cells.map((cell) => {
        const style = styles(cell);
        const span = Number(cell.attribs.colspan) || 1;
        const width = style.width?.endsWith("%")
          ? pageWidth * parseFloat(style.width) / 100 : pageWidth * span / columns;
        const borders = [["t", "top"], ["l", "left"], ["b", "bottom"], ["r", "right"]].map(([code, side]) => {
          const border = style[`border-${side}`] || style.border || styles(table).border || "none";
          return `\\clbrdr${code}` + (border !== "none" && !border.startsWith("0") ? "\\brdrs\\brdrw10" : "\\brdrnil");
        }).join("");
        const padding = (style.padding || "0").split(/\s+/);
        const topPadding = twips(style["padding-top"] || padding[0]);
        const sourceBottomPadding = twips(style["padding-bottom"] || padding[2] || padding[0]);
        // Keep a 12-point inset after the final court-heading line in RTF,
        // including templates that combine both heading lines in one cell.
        const endsWithStateHeading = /\bSTATE OF UTAH\s*$/i.test(textContent(cell));
        const bottomPadding = endsWithStateHeading ? Math.max(sourceBottomPadding, 240) : sourceBottomPadding;
        // Cell padding must be exported explicitly; paragraph line breaks only
        // provide space after the content and cannot preserve the top inset.
        const verticalPadding = `\\clpadt${topPadding}\\clpadft3\\clpadb${bottomPadding}\\clpadfb3`;
        const background = colorIndex(style["background-color"] || style.background);
        return Array.from({ length: span }, (_, index) => {
          edge += width / span;
          const merge = span > 1 ? index === 0 ? "\\clmgf" : "\\clmrg" : "";
          return `${merge}${borders}${verticalPadding}${background ? `\\clcbpat${background}` : ""}\\clvertalt\\cellx${Math.round(edge)}`;
        }).join("");
      }).join("");
      const content = cells.map((cell) => {
        const style = styles(cell);
        const align = style["text-align"] === "center" ? "\\qc" : style["text-align"] === "right" ? "\\qr" : "\\ql";
        const extraCells = "\\cell ".repeat(Math.max(0, (Number(cell.attribs.colspan) || 1) - 1));
        const width = style.width?.endsWith("%")
          ? pageWidth * parseFloat(style.width) / 100 : pageWidth * (Number(cell.attribs.colspan) || 1) / columns;
        // A tab leader fills the remaining cell width without a fixed run of
        // underscores pushing the approval label onto a second printed line.
        // The cell's bottom padding supplies the final inset. A trailing line
        // break would add another blank line below the Judge/signature text.
        const cellContent = renderChildren(cell, true).replace(/\\line\s*$/, "");
        const approvalTab = cellContent.includes("Approved as to form:\\tab ")
          ? `\\tqr\\tlul\\tx${Math.max(0, Math.round(width - 160))}` : "";
        return `\\pard\\intbl${align}${approvalTab}\\f0\\fs24 {${formatting(cell)} ${cellContent}}\\cell ${extraCells}`;
      }).join("");
      return `{\\trowd\\trgaph80${definitions}\n${content}\\row}\n`;
    }).join("") + "\\pard ";
  }

  function formatting(element: Element): string {
    const style = styles(element);
    const bold = ["b", "strong", "th", "h1", "h2", "h3"].includes(element.name) ||
      style["font-weight"] === "bold" || Number(style["font-weight"]) >= 600;
    return [
      bold ? "\\b" : "",
      ["i", "em"].includes(element.name) || style["font-style"] === "italic" ? "\\i" : "",
      element.name === "u" || style["text-decoration"]?.includes("underline") ? "\\ul" : "",
      style["font-size"] ? `\\fs${Math.round(twips(style["font-size"]) / 10)}` : "",
      style["font-family"]?.includes("Arial") ? "\\f1" : "",
      style.color ? `\\cf${colorIndex(style.color)}` : ""
    ].join("");
  }

  function render(node: AnyNode, inCell = false): string {
    if (node.type === "text") {
      if (inCell && /^\s*Approved as to form:\s*_+\s*$/i.test(node.data)) {
        return "Approved as to form:\\tab ";
      }
      return escapeRtf(node.data);
    }
    if (!isTag(node) || ["script", "style", "head"].includes(node.name)) return "";
    if (node.name === "table") return renderTable(node, inCell);
    if (node.name === "br") return "\\line ";
    const content = renderChildren(node, inCell);
    const format = formatting(node);
    if (["p", "div", "h1", "h2", "h3", "li"].includes(node.name)) {
      const style = styles(node);
      const align = style["text-align"] === "center" ? "\\qc" : style["text-align"] === "right" ? "\\qr" : "\\ql";
      const margin = (style.margin || "0").split(/\s+/);
      const beforeSpacing = twips(style["margin-top"] || margin[0]) + twips(style["padding-top"]);
      const spacing = `\\sb${beforeSpacing}\\sa${twips(style["margin-bottom"] || margin[2] || margin[0])}`;
      const indent = `\\fi${twips(style["text-indent"])}\\li${twips(style["margin-left"])}`;
      const lineHeight = style["line-height"] ? `\\sl${twips(style["line-height"])}\\slmult0` : "";
      if (inCell) return `{${format} ${content}}\\line `;
      return `{\\pard${align}${spacing}${indent}${lineHeight}${format} ${node.name === "li" ? "\\bullet\\tab " : ""}${content}\\par}\n`;
    }
    return `{${format} ${content}}`;
  }

  const content = parseDocument(html).children.map((node) => render(node)).join("");
  return `{\\rtf1\\ansi\\ansicpg1252\\uc1\\deff0{\\fonttbl{\\f0 Times New Roman;}{\\f1 Arial;}}` +
    `{\\colortbl;${colors.join("")}}\\paperw12240\\paperh15840\\margl1440\\margr1440\\margt1440\\margb1440\\f0\\fs24\n${content}}`;
}
