import * as mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export interface DocxParseResult {
  text: string;
  html: string;
  paragraphs: string[];
}

/**
 * Extract clean text, paragraphs, and HTML from an uploaded DOCX file.
 */
export async function parseDocxFile(file: File): Promise<DocxParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Extract clean plain text
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = textResult.value || "";

  // Extract clean structured HTML
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || "";

  // Split into clean paragraphs
  const paragraphs = rawText
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return {
    text: rawText.trim(),
    html,
    paragraphs: paragraphs.length > 0 ? paragraphs : [rawText.trim()],
  };
}

/**
 * Generate a formatted DOCX blob preserving document alignment, fonts, and clean margins.
 */
export async function generateDocxBlob(
  text: string,
  title: string = "Humanized Report"
): Promise<Blob> {
  const rawParagraphs = text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const docParagraphs: Paragraph[] = [];

  // Add Report Title
  docParagraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Add Date / Subtitle
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Processed with RephrazeAI • Continuous Model Engine`,
          italics: true,
          color: "666666",
          size: 20, // 10pt
        }),
      ],
    })
  );

  // Add Document Body Paragraphs
  for (const paraText of rawParagraphs) {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 200, line: 360 }, // 1.5 line spacing
        children: [
          new TextRun({
            text: paraText,
            size: 24, // 12pt
            font: "Calibri",
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Trigger direct client-side download of a generated DOCX blob.
 */
export function downloadDocxBlob(blob: Blob, filename: string = "Humanized-Report.docx") {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
