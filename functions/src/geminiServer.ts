/**
 * Gemini via REST (avoids bundling @google/genai server-side peer/type issues in Functions).
 * https://ai.google.dev/api/rest/v1beta/models/generateContent
 */

const GEMINI_FLASH = "gemini-2.0-flash";
const GEMINI_TTS = "gemini-2.5-flash-preview-tts";

async function generateContent(
  apiKey: string,
  model: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }
  return res.json();
}

function textFromResponse(data: unknown): string {
  const d = data as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function geminiGenerateForm(apiKey: string, prompt: string): Promise<unknown> {
  const data = await generateContent(apiKey, GEMINI_FLASH, {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Generate a form definition based on this request: "${prompt}".
Return a JSON object with "title", "description", and "fields".
Each field should have "type" (text, number, email, textarea, select, radio, checkbox, date), "label", "placeholder", "required" (boolean), and "options" (array of strings, only for select/radio/checkbox).`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
  const text = textFromResponse(data);
  return JSON.parse(text || "{}");
}

export async function geminiChat(apiKey: string, messages: { role: string; parts: { text: string }[] }[]): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.parts[0]?.text ?? "";
  const data = await generateContent(apiKey, GEMINI_FLASH, {
    systemInstruction: {
      parts: [
        {
          text: "You are FormFlow Assistant, a helpful AI that helps users build and manage forms. You can suggest form fields, help with descriptions, and answer questions about form building best practices.",
        },
      ],
    },
    contents: [{ role: "user", parts: [{ text: lastMessage }] }],
  });
  return textFromResponse(data);
}

export async function geminiTranscribe(apiKey: string, base64Audio: string): Promise<string> {
  const data = await generateContent(apiKey, GEMINI_FLASH, {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "audio/wav", data: base64Audio } },
          { text: "Transcribe this audio accurately." },
        ],
      },
    ],
  });
  return textFromResponse(data);
}

export async function geminiTts(apiKey: string, text: string): Promise<string | undefined> {
  const data = await generateContent(apiKey, GEMINI_TTS, {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });
  const d = data as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
  };
  return d.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}
