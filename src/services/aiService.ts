import { GoogleGenAI, Type } from "@google/genai";
import { Note, Task } from "../types";

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

export const extractTasks = async (content: string): Promise<Partial<Task>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extrae una lista de tareas (to-do items) del siguiente contenido. Para cada tarea, identifica el texto de la tarea y, si es posible, una fecha de vencimiento (en formato YYYY-MM-DD) y una prioridad (low, medium, high). Devuelve el resultado como un objeto JSON con una lista de tareas.\n\nContenido: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["low", "medium", "high"] }
                },
                required: ["text"]
              }
            }
          }
        }
      }
    });
    const result = JSON.parse(response.text || '{"tasks": []}');
    return result.tasks;
  } catch (error) {
    console.error("Error extracting tasks:", error);
    return [];
  }
};

export const suggestConnections = async (currentNote: Note, allNotes: Note[]): Promise<string[]> => {
  try {
    const context = allNotes
      .filter(n => n.id !== currentNote.id)
      .map(n => `ID: ${n.id}\nTítulo: ${n.title}\nResumen: ${n.summary || n.content.substring(0, 100)}`)
      .join("\n---\n");
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza la siguiente nota y sugiere hasta 5 notas relacionadas de la lista proporcionada que podrían formar una "segunda memoria" (Second Brain). Devuelve ÚNICAMENTE una lista de IDs de notas separados por comas.\n\nNota Actual:\nTítulo: ${currentNote.title}\nContenido: ${currentNote.content}\n\nNotas Disponibles:\n${context}`,
    });
    const text = response.text || "";
    return text.split(",").map(id => id.trim()).filter(id => id.length > 0);
  } catch (error) {
    console.error("Error suggesting connections:", error);
    return [];
  }
};

export const processMultimodalCapture = async (fileData: string, mimeType: string): Promise<{ title: string; content: string; tags: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        },
        {
          text: "Analiza este archivo (imagen, audio o documento) y transfórmalo en una nota estructurada. Genera un título descriptivo, el contenido principal extraído y una lista de etiquetas relevantes. Devuelve el resultado como un objeto JSON."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "content", "tags"]
        }
      }
    });
    return JSON.parse(response.text || '{"title": "Nueva Nota", "content": "", "tags": []}');
  } catch (error) {
    console.error("Error in multimodal capture:", error);
    return { title: "Error en captura", content: "No se pudo procesar el archivo.", tags: [] };
  }
};

export const rewriteContent = async (content: string, instruction: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un editor experto. Reescribe el siguiente contenido siguiendo esta instrucción: "${instruction}". Mantén el formato Markdown si es necesario.\n\nContenido Original:\n${content}`,
    });
    return response.text || content;
  } catch (error) {
    console.error("Error rewriting content:", error);
    return content;
  }
};

export const generatePredictiveSuggestions = async (userContext: string, notes: Note[]): Promise<string[]> => {
  try {
    const context = notes.slice(0, 10).map(n => n.title).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Basándote en el contexto actual del usuario ("${userContext}") y sus notas recientes (${context}), predice 3 temas o notas que el usuario podría necesitar pronto. Devuelve ÚNICAMENTE una lista de sugerencias cortas separadas por comas.`,
    });
    const text = response.text || "";
    return text.split(",").map(s => s.trim()).filter(s => s.length > 0);
  } catch (error) {
    console.error("Error generating predictive suggestions:", error);
    return [];
  }
};
