import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR,
});

// Check if API key is properly configured
if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
  console.error("OPENAI_API_KEY environment variable is required");
}

export async function transcribeAudio(
  audioFilePath: string,
): Promise<{ text: string; duration?: number }> {
  const audioReadStream = fs.createReadStream(audioFilePath);

  const transcription = await openai.audio.transcriptions.create({
    file: audioReadStream,
    model: "whisper-1",
  });

  return {
    text: transcription.text,
    duration: 0, // Duration not provided by OpenAI API, will be calculated elsewhere
  };
}

export async function processNote(
  transcription: string,
  language: string = "en",
  style: string = "minimal",
): Promise<{
  title: string;
  processedNote: string;
}> {
  const system = [
    "You are a multilingual text-cleanup assistant.",
    "Your core rules:",
    "1) Do NOT summarize or drop content. Keep all details.",
    "2) Fix spacing, punctuation, casing, and paragraph breaks.",
    "3) Keep mixed-language segments as-is.",
    "5) Respect style:",
    "   - minimal: clean and lightly reorder only to fix obvious fragmentation; preserve original structure and meaning.",
    "   - narrative: rewrite into flowing paragraphs without adding or removing facts.",
    "6) Never invent facts or names. If something is unclear, keep it verbatim.",
    "7) Output valid JSON only, matching the provided schema.",
  ].join("\n");

  const schema = {
    name: "NoteOutput",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          type: "string",
          description: "Max 60 chars, concise and descriptive",
        },
        processedNote: {
          type: "string",
          description: "Final cleaned note text",
        },
      },
      required: ["title", "processedNote"],
    },
    strict: true,
  } as const;

  const userPayload = {
    transcription,
    language, 
    style, // "minimal" | "narrative"
    constraints: {
      maxTitleChars: 60,
      keepAllDetails: true,
      allowReorderForClarity: style === "narrative",
      preserveMixedLanguage: language === "preserve",
    },
  };

  const prompt = [
    "Task: Clean and organize this voice transcription into a polished note.",
    "Return JSON matching the schema only.",
    "",
    "Now process the following payload:",
    JSON.stringify(userPayload, null, 2),
  ].join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-5" if you prefer; 4o-mini is cheap and good at formatting
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: schema },
      temperature: 0.2,
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const result = JSON.parse(raw);

    return {
      title: result.title || "Untitled Note",
      processedNote: result.processedNote || transcription,
    };
  } catch (error) {
    console.error("Error processing note with AI:", error);
    return {
      title: "Voice Note " + new Date().toLocaleDateString(),
      processedNote: transcription,
    };
  }
}
