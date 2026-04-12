"use strict";
/**
 * Gemini via REST (avoids bundling @google/genai server-side peer/type issues in Functions).
 * https://ai.google.dev/api/rest/v1beta/models/generateContent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiGenerateForm = geminiGenerateForm;
exports.geminiChat = geminiChat;
exports.geminiTranscribe = geminiTranscribe;
exports.geminiTts = geminiTts;
const GEMINI_FLASH = "gemini-2.0-flash";
const GEMINI_TTS = "gemini-2.5-flash-preview-tts";
async function generateContent(apiKey, model, body) {
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
function textFromResponse(data) {
    var _a, _b, _c, _d, _e, _f;
    const d = data;
    return (_f = (_e = (_d = (_c = (_b = (_a = d.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : "";
}
async function geminiGenerateForm(apiKey, prompt) {
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
async function geminiChat(apiKey, messages) {
    var _a, _b, _c;
    const lastMessage = (_c = (_b = (_a = messages[messages.length - 1]) === null || _a === void 0 ? void 0 : _a.parts[0]) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : "";
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
async function geminiTranscribe(apiKey, base64Audio) {
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
async function geminiTts(apiKey, text) {
    var _a, _b, _c, _d, _e, _f;
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
    const d = data;
    return (_f = (_e = (_d = (_c = (_b = (_a = d.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.inlineData) === null || _f === void 0 ? void 0 : _f.data;
}
//# sourceMappingURL=geminiServer.js.map