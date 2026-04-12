import { GoogleGenAI, Type } from "@google/genai";
import { FormField } from "./types";
import { httpsCallable, functions } from "./firebase";

const useClientGemini = () =>
  import.meta.env.DEV && Boolean((process.env.GEMINI_API_KEY as string | undefined)?.length);

async function callGeminiProxy<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const fn = httpsCallable(functions, "geminiProxy");
  const res = await fn({ action, ...payload });
  return res.data as T;
}

const clientAi = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateFormFromPrompt = async (prompt: string) => {
  if (useClientGemini()) {
    const ai = clientAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate a form definition based on this request: "${prompt}". 
    Return a JSON object with "title", "description", and "fields". 
    Each field should have "type" (text, number, email, textarea, select, radio, checkbox, date), "label", "placeholder", "required" (boolean), and "options" (array of strings, only for select/radio/checkbox).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                  placeholder: { type: Type.STRING },
                  required: { type: Type.BOOLEAN },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["type", "label", "required"],
              },
            },
          },
          required: ["title", "fields"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  }
  const { result } = await callGeminiProxy<{ result: unknown }>("generateForm", { prompt });
  return result;
};

export const chatWithAssistant = async (
  messages: { role: "user" | "model"; parts: { text: string }[] }[]
) => {
  if (useClientGemini()) {
    const ai = clientAi();
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction:
          "You are FormFlow Assistant, a helpful AI that helps users build and manage forms. You can suggest form fields, help with descriptions, and answer questions about form building best practices.",
      },
    });
    const lastMessage = messages[messages.length - 1]?.parts[0]?.text ?? "";
    const response = await chat.sendMessage({ message: lastMessage });
    return response.text;
  }
  const { text } = await callGeminiProxy<{ text: string }>("chat", { messages });
  return text;
};

export const transcribeAudio = async (base64Audio: string) => {
  if (useClientGemini()) {
    const ai = clientAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          inlineData: {
            mimeType: "audio/wav",
            data: base64Audio,
          },
        },
        { text: "Transcribe this audio accurately." },
      ],
    });
    return response.text;
  }
  const { text } = await callGeminiProxy<{ text: string }>("transcribe", { base64Audio });
  return text;
};

export const generateSpeech = async (text: string) => {
  if (useClientGemini()) {
    const ai = clientAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
  const { audioBase64 } = await callGeminiProxy<{ audioBase64?: string }>("tts", { text });
  return audioBase64;
};
