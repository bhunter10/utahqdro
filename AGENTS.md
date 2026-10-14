# Project Notes

- Display dates in long US format, for example `November 24, 2025`, in generated document/template output and non-editable summaries. Keep date form fields as native date pickers, and keep stored form values normalized as `MM-DD-YYYY` when practical.
- For document templates that export to Google Docs, keep source template markup semantic and readable, then centralize export styling in named style maps before inlining styles for Google Docs reliability.
- Avoid relying on `<br />` for important layout inside Google Docs-sensitive areas, especially table cells. Use explicit block rows for lines that must stay separate.
- Use bordered tables only where borders are intended. Use borderless tables for two-column date/signature layouts so Google Docs preserves columns without adding visible borders.
- Keep template spacing simple and consistent. Prefer one clear spacing rule per block type instead of stacked table margins, spacer paragraphs, and paragraph top margins.
- Google Docs HTML import can ignore table bottom margins and the following paragraph's top margin. For a required gap after the court caption, use the Google-export-only spacer in `lib/google-document-html.ts`: one nonbreaking-space paragraph with 12pt height/line-height and zero margin/padding. Clear the following paragraph's top margin to avoid doubling the gap. This was visually confirmed in Google Docs; keep preview and DOCX spacing separate and verify future spacing fixes in the actual Google export.
