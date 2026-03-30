import { GoogleGenAI } from "@google/genai";
import { Note } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const summarizeNote = async (note: Note): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Resume la siguiente nota en un párrafo conciso (máximo 3 oraciones). El resumen debe capturar los puntos principales y el tono de la nota.\n\nTítulo: ${note.title}\nContenido: ${note.content}`,
    });
    return response.text || "No se pudo generar el resumen.";
  } catch (error) {
    console.error("Error summarizing note:", error);
    return "Error al generar el resumen.";
  }
};

export const askAboutNotes = async (query: string, notes: Note[]): Promise<string> => {
  try {
    const context = notes.map(n => `Título: ${n.title}\nContenido: ${n.content}`).join("\n---\n");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres un asistente de IA para una aplicación de notas llamada Cortexa. A continuación se encuentra el contenido de las notas del usuario. Responde a la pregunta del usuario basándote ÚNICAMENTE en las notas proporcionadas. Si la respuesta no está en las notas, dilo.\n\nContexto de las Notas:\n${context}\n\nPregunta del Usuario: ${query}`,
    });
    return response.text || "No pude encontrar una respuesta en tus notas.";
  } catch (error) {
    console.error("Error asking about notes:", error);
    return "Encontré un error al procesar tu solicitud.";
  }
};

export const suggestTags = async (content: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Basándote en el siguiente contenido de la nota, sugiere de 3 a 5 etiquetas relevantes (palabras sueltas, en minúsculas). Devuelve ÚNICAMENTE una lista de etiquetas separadas por comas.\n\nContenido: ${content}`,
    });
    const text = response.text || "";
    return text.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return [];
  }
};
