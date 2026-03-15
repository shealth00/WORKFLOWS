import { GoogleGenAI, Type } from "@google/genai";
import { FormField } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateFormFromPrompt = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
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
                options: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["type", "label", "required"]
            }
          }
        },
        required: ["title", "fields"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const chatWithAssistant = async (messages: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: "You are FormFlow Assistant, a helpful AI that helps users build and manage forms. You can suggest form fields, help with descriptions, and answer questions about form building best practices."
    }
  });

  // We need to send previous messages to maintain context
  // For simplicity in this demo, we'll just send the last message or a few
  const lastMessage = messages[messages.length - 1].parts[0].text;
  const response = await chat.sendMessage({ message: lastMessage });
  return response.text;
};

export const transcribeAudio = async (base64Audio: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "audio/wav",
          data: base64Audio
        }
      },
      { text: "Transcribe this audio accurately." }
    ]
  });
  return response.text;
};

export const generateSpeech = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }
        }
      }
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
