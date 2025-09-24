import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration?: number }> {
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

export async function processNote(transcription: string, language: string = "en", style: string = "structured"): Promise<{
  title: string;
  processedNote: string;
}> {
  const prompt = `Please process this voice note transcription and provide:
1. A clear, descriptive title (max 60 characters)
2. A well-organized note based on the content

Transcription: "${transcription}"

Output language: ${language}
Organization style: ${style === "structured" ? "Use bullet points, headings, and clear structure" : style === "narrative" ? "Use paragraph format with clear flow" : "Clean up the text minimally while preserving the original structure"}

Respond with JSON in this exact format: {"title": "Generated Title", "processedNote": "Organized note content"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert note-taking assistant. Create clear, organized notes from voice transcriptions. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      title: result.title || "Untitled Note",
      processedNote: result.processedNote || transcription,
    };
  } catch (error) {
    console.error("Error processing note with AI:", error);
    // Fallback to basic processing
    return {
      title: "Voice Note " + new Date().toLocaleDateString(),
      processedNote: transcription,
    };
  }
}

export async function generateTitle(transcription: string, language: string = "en"): Promise<string> {
  const prompt = `Generate a clear, descriptive title (max 60 characters) for this voice note transcription in ${language}:

"${transcription}"

Respond with JSON: {"title": "Generated Title"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a title generation expert. Create concise, descriptive titles for voice notes. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.title || "Untitled Note";
  } catch (error) {
    console.error("Error generating title:", error);
    return "Voice Note " + new Date().toLocaleDateString();
  }
}
