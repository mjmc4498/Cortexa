import { GoogleGenAI, Type } from "@google/genai";
import { Note, Task } from "../../models/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const OPENROUTER_API_KEY = "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";

const callOpenRouter = async (prompt: string, jsonMode = false) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Cortexa AI Notes",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "user", content: prompt }],
        response_format: jsonMode ? { type: "json_object" } : undefined
      })
    });
    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenRouter API Error:", data);
      return null;
    }

    if (!data.choices || data.choices.length === 0) {
      console.error("OpenRouter returned no choices:", data);
      return null;
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    return null;
  }
};

export const summarizeNote = async (note: Note): Promise<string> => {
  try {
    const prompt = `Resume la siguiente nota en un párrafo conciso (máximo 3 oraciones). El resumen debe capturar los puntos principales y el tono de la nota.\n\nTítulo: ${note.title}\nContenido: ${note.content}`;
    const result = await callOpenRouter(prompt);
    return result || "No se pudo generar el resumen.";
  } catch (error) {
    console.error("Error summarizing note:", error);
    return "Error al generar el resumen.";
  }
};

export const askAboutNotes = async (query: string, notes: Note[]): Promise<string> => {
  try {
    const context = notes.map(n => `Título: ${n.title}\nContenido: ${n.content}`).join("\n---\n");
    const prompt = `Eres un asistente de IA para una aplicación de notas llamada Cortexa. A continuación se encuentra el contenido de las notas del usuario. Responde a la pregunta del usuario basándote ÚNICAMENTE en las notas proporcionadas. Si la respuesta no está en las notas, dilo.\n\nContexto de las Notas:\n${context}\n\nPregunta del Usuario: ${query}`;
    const result = await callOpenRouter(prompt);
    return result || "No pude encontrar una respuesta en tus notas.";
  } catch (error) {
    console.error("Error asking about notes:", error);
    return "Encontré un error al procesar tu solicitud.";
  }
};

export const suggestTags = async (content: string): Promise<string[]> => {
  try {
    const prompt = `Basándote en el siguiente contenido de la nota, sugiere de 3 a 5 etiquetas relevantes (palabras sueltas, en minúsculas). Devuelve ÚNICAMENTE una lista de etiquetas separadas por comas.\n\nContenido: ${content}`;
    const result = await callOpenRouter(prompt);
    if (!result) return [];
    return result.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0);
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return [];
  }
};

export const extractTasks = async (content: string): Promise<Partial<Task>[]> => {
  try {
    const prompt = `Extrae una lista de tareas (to-do items) del siguiente contenido. Para cada tarea, identifica el texto de la tarea y, si es posible, una fecha de vencimiento (en formato YYYY-MM-DD) y una prioridad (low, medium, high). Devuelve el resultado como un objeto JSON con una lista de tareas bajo la clave "tasks".\n\nContenido: ${content}`;
    const result = await callOpenRouter(prompt, true);
    if (!result) return [];
    const json = JSON.parse(result);
    return json.tasks || [];
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
    
    const prompt = `Analiza la siguiente nota y sugiere hasta 5 notas relacionadas de la lista proporcionada que podrían formar una "segunda memoria" (Second Brain). Devuelve ÚNICAMENTE una lista de IDs de notas separados por comas.\n\nNota Actual:\nTítulo: ${currentNote.title}\nContenido: ${currentNote.content}\n\nNotas Disponibles:\n${context}`;
    const result = await callOpenRouter(prompt);
    if (!result) return [];
    return result.split(",").map((id: string) => id.trim()).filter((id: string) => id.length > 0);
  } catch (error) {
    console.error("Error suggesting connections:", error);
    return [];
  }
};

export const processMultimodalCapture = async (fileData: string, mimeType: string): Promise<{ title: string; content: string; tags: string[] }> => {
  // Multimodal is better handled by Gemini directly for now as OpenRouter multimodal support varies
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
    const prompt = `Actúa como un editor experto. Reescribe el siguiente contenido siguiendo esta instrucción: "${instruction}". Mantén el formato Markdown si es necesario.\n\nContenido Original:\n${content}`;
    const result = await callOpenRouter(prompt);
    return result || content;
  } catch (error) {
    console.error("Error rewriting content:", error);
    return content;
  }
};

export const generatePredictiveSuggestions = async (userContext: string, notes: Note[]): Promise<string[]> => {
  try {
    const context = notes.slice(0, 10).map(n => n.title).join(", ");
    const prompt = `Basándote en el contexto actual del usuario ("${userContext}") y sus notas recientes (${context}), predice 3 temas o notas que el usuario podría necesitar pronto. Devuelve ÚNICAMENTE una lista de sugerencias cortas separadas por comas.`;
    const result = await callOpenRouter(prompt);
    if (!result) return [];
    return result.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  } catch (error) {
    console.error("Error generating predictive suggestions:", error);
    return [];
  }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [text],
    });
    return result.embeddings[0].values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
};

export const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA.length || !vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const semanticSearch = async (query: string, notes: Note[]): Promise<Note[]> => {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding.length) return [];

  const scoredNotes = notes
    .filter(n => n.embedding && n.embedding.length > 0)
    .map(n => ({
      note: n,
      score: calculateCosineSimilarity(queryEmbedding, n.embedding!)
    }))
    .sort((a, b) => b.score - a.score);

  return scoredNotes.filter(n => n.score > 0.6).map(n => n.note);
};

export const generateWeeklyReport = async (notes: Note[]): Promise<string> => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentNotes = notes.filter(n => new Date(n.updatedAt) > weekAgo);
    
    if (recentNotes.length === 0) return "No se encontraron notas recientes para generar un reporte.";

    const context = recentNotes.map(n => `- ${n.title}: ${n.summary || n.content.substring(0, 50)}`).join("\n");
    const prompt = `Genera un reporte semanal de productividad y temas clave basado en las siguientes notas del usuario:\n\n${context}\n\nEl reporte debe incluir:\n1. Resumen de actividades.\n2. Temas recurrentes.\n3. Sugerencias para la próxima semana.\n4. Insights sobre el progreso del conocimiento.`;
    const result = await callOpenRouter(prompt);
    return result || "Error al generar el reporte.";
  } catch (error) {
    console.error("Error generating weekly report:", error);
    return "Error al generar el reporte semanal.";
  }
};

export const detectContextualNotes = async (location: string, time: string, calendar: string, notes: Note[]): Promise<Note[]> => {
  try {
    const context = notes.map(n => `ID: ${n.id}, Título: ${n.title}, Etiquetas: ${n.tags.join(",")}`).join("\n");
    const prompt = `Basándote en el contexto actual del usuario:\n- Ubicación: ${location}\n- Hora: ${time}\n- Calendario: ${calendar}\n\nSelecciona hasta 3 notas de la siguiente lista que sean más relevantes para este momento. Devuelve ÚNICAMENTE una lista de IDs separados por comas.\n\nNotas:\n${context}`;
    const result = await callOpenRouter(prompt);
    if (!result) return [];
    const ids = result.split(",").map((id: string) => id.trim());
    return notes.filter(n => ids.includes(n.id));
  } catch (error) {
    console.error("Error detecting contextual notes:", error);
    return [];
  }
};
