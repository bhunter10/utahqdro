import { NextResponse } from "next/server";
import {
  aiIntakeFieldMap,
  buildAiExtractionPrompt,
  normalizeAiFieldValue,
  type AiExtractedField,
  type AiExtractionResult,
  type AiUploadedFile
} from "@/lib/ai-intake";

export const runtime = "nodejs";

type ExtractRequest = {
  files?: AiUploadedFile[];
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "fields"],
  properties: {
    summary: { type: "string" },
    fields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "value", "confidence", "source", "note"],
        properties: {
          id: { type: "string" },
          value: { type: "string" },
          confidence: { type: "string", enum: ["found", "review", "missing"] },
          source: { type: "string" },
          note: { type: "string" }
        }
      }
    }
  }
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExtractRequest;
    const files = (body.files || []).filter((file) => file.url && file.name);

    if (!files.length) {
      return NextResponse.json({ message: "Upload at least one document before extraction." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          message: "OPENAI_API_KEY is not configured. Uploads are saved, but extraction cannot run yet.",
          result: { summary: "AI extraction is waiting for OpenAI configuration.", fields: [] }
        },
        { status: 503 }
      );
    }

    const content: Array<Record<string, string>> = [
      { type: "input_text", text: buildAiExtractionPrompt() }
    ];

    for (const file of files) {
      const fetched = await fetch(file.url);
      if (!fetched.ok) {
        throw new Error(`Could not read ${file.name} from Firebase Storage.`);
      }

      const arrayBuffer = await fetched.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || fetched.headers.get("content-type") || "application/octet-stream";

      if (mimeType.startsWith("image/")) {
        content.push({
          type: "input_image",
          image_url: `data:${mimeType};base64,${base64}`
        });
      } else {
        content.push({
          type: "input_file",
          filename: file.name,
          file_data: `data:${mimeType};base64,${base64}`
        });
      }
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_QDRO_EXTRACTION_MODEL || "gpt-6-luna",
        input: [
          {
            role: "user",
            content
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "qdro_intake_extraction",
            strict: true,
            schema: responseSchema
          }
        }
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || "OpenAI extraction failed.";
      return NextResponse.json({ message }, { status: response.status });
    }

    const rawText = extractResponseText(payload);
    const parsed = JSON.parse(rawText) as AiExtractionResult;
    const result: AiExtractionResult = {
      summary: parsed.summary || "Documents reviewed.",
      fields: normalizeExtractedFields(parsed.fields || [])
    };

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not extract document details." },
      { status: 500 }
    );
  }
}

function extractResponseText(payload: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (payload.output_text) return payload.output_text;

  const text = payload.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("OpenAI did not return extraction JSON.");
  return text;
}

function normalizeExtractedFields(fields: AiExtractedField[]) {
  return fields
    .filter((field) => aiIntakeFieldMap.has(field.id))
    .map((field) => {
      const intakeField = aiIntakeFieldMap.get(field.id);
      return {
        id: field.id,
        value: normalizeAiFieldValue(intakeField, field.value || ""),
        confidence: field.confidence,
        source: field.source || "Uploaded documents",
        note: field.note || ""
      };
    });
}
