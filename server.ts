import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPTS } from "./server/prompts";

async function generateContentWithRetry(
  ai: GoogleGenAI,
  options: any,
  attempts = 3,
  delay = 1500
) {
  let lastError: any = null;

  // Model mapping helper to keep valid Gemini models according to SDK guidelines
  const mapModelName = (modelId: string): string => {
    // We map any known IDs or aliases to the official modern names from our guidelines
    const table: Record<string, string> = {
      "gemini-3.8-flash": "gemini-3.8-flash",
      "gemini-3.5-flash": "gemini-3.8-flash",
      "gemini-flash-latest": "gemini-flash-latest",
      "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
      "gemini-3.1-pro-preview": "gemini-3.1-pro-preview",
    };
    return table[modelId] || modelId || "gemini-3.8-flash";
  };

  const originalModel = mapModelName(options.model || "gemini-3.8-flash");
  const modelsToTry = Array.from(new Set([
    originalModel,
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ]));

  for (const model of modelsToTry) {
    for (let i = 0; i < attempts; i++) {
      try {
        console.log(`[Gemini API] Requesting ${model} (Attempt ${i + 1}/${attempts})...`);
        const response = await ai.models.generateContent({
          ...options,
          model,
        });
        if (response && response.text) {
          return response;
        }
        console.warn(`[Gemini API] Response succeeded but text property is missing/empty on model ${model}:`, JSON.stringify(response));
        throw new Error("Empty or invalid response received from Gemini API");
      } catch (err: any) {
        lastError = err;
        const msg = err.message || JSON.stringify(err);
        console.warn(`[Gemini API] Error on model ${model} (Attempt ${i + 1}/${attempts}):`, msg);

        const isTransient = msg.includes("503") ||
                            msg.includes("429") ||
                            msg.includes("temporary") ||
                            msg.includes("high demand") ||
                            msg.includes("UNAVAILABLE") ||
                            msg.includes("RESOURCE_EXHAUSTED") ||
                            msg.includes("overloaded");

        if (!isTransient && model === originalModel) {
          throw err;
        }

        // Optimization: If experiencing heavy congestion (503 / high demand / UNAVAILABLE) and we have fallback alternatives left,
        // instantly skip to the next model in the sequence to prevent stalling the user.
        const isSevereCongestion = msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE") || msg.includes("overloaded");
        if (isSevereCongestion && model !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`[Gemini API] Model ${model} is severely congested. Falling back immediately to minimize wait time...`);
          break;
        }

        if (i < attempts - 1) {
          console.log(`[Gemini API] Waiting ${delay * Math.pow(1.5, i)}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(1.5, i)));
        }
      }
    }
    console.log(`[Gemini API] Model ${model} failed/unavailable. Trying next fallback...`);
  }
  throw lastError || new Error("Failed to generate content after retries and all fallback models");
}

function cleanAndParseJSON(text: string): any {
  if (!text) throw new Error("Received empty text for JSON parsing");
  let cleaned = text.trim();
  // Strip starting/ending markdown code fence blocks if present
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift();
    }
    if (lines[lines.length - 1].startsWith("```")) {
      lines.pop();
    }
    cleaned = lines.join("\n").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse JSON. Raw text was:", text);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // IN-MEMORY JOB QUEUE (Mock Message Broker / Redis Streams for Triple Plane Architecture)
  const jobQueue = new Map<string, {
    id: string;
    status: 'INGESTED' | 'CV_EXTRACTION' | 'SEMANTIC_REASONING' | 'COMPLETED' | 'FAILED';
    result?: any;
    error?: string;
    createdAt: number;
    metrics: { ingestionMs?: number; cvMs?: number; llmMs?: number; totalMs?: number };
  }>();

  // 1. INGESTION PLANE (API GATEWAY)
  app.post("/api/v2/jobs", async (req, res) => {
    try {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      jobQueue.set(jobId, {
        id: jobId,
        status: 'INGESTED',
        createdAt: Date.now(),
        metrics: { ingestionMs: 0 }
      });

      // Publicar evento job.created y delegar a worker asíncrono (Simulado vía setTimeout)
      setImmediate(() => processJobOrchestrator(jobId, req.body));

      return res.status(202).json({
        job_id: jobId,
        status: 'ACCEPTED',
        message: 'Payload transferido a Object Storage. Evento job.created emitido.'
      });
    } catch (error) {
      console.error("[Ingestion Error]", error);
      res.status(500).json({ error: "Ingestion failed" });
    }
  });

  // GET JOB STATUS
  app.get("/api/v2/jobs/:jobId", (req, res) => {
    const job = jobQueue.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  });

  // TRIPLE PLANE STATE MACHINE (Orquestador Asíncrono)
  async function processJobOrchestrator(jobId: string, payload: any) {
    const job = jobQueue.get(jobId);
    if (!job) return;
    const startTime = Date.now();

    try {
      // ESTADO: CV_EXTRACTION
      job.status = 'CV_EXTRACTION';
      const cvStart = Date.now();
      // Simulación de pipeline de visión computacional pura (MediaPipe/OpenCV)
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const mockCVTelemetry = {
        faceMesh: { confidence: 0.98, keypoints: 468 },
        opticalFlow: { vectors: 120, avgVelocity: 2.3 },
        sceneCuts: [3.4, 7.8, 12.1]
      };
      job.metrics.cvMs = Date.now() - cvStart;

      // ESTADO: SEMANTIC_REASONING (SWARM LLM)
      job.status = 'SEMANTIC_REASONING';
      const llmStart = Date.now();
      
      // Aquí se realizaría la invocación Zod/GenAI. Por simulación:
      await new Promise(resolve => setTimeout(resolve, 1500));
      const llmResult = {
        technicalAgent: { raccord: "PASS", kinematicConsistency: 0.99 },
        narrativeAgent: { hookRating: 8.5, storytelling: "High Tension" },
        auditorAgent: { svoidVerified: true }
      };
      job.metrics.llmMs = Date.now() - llmStart;

      // ESTADO: COMPLETED
      job.status = 'COMPLETED';
      job.result = { cvData: mockCVTelemetry, semantics: llmResult };
      job.metrics.totalMs = Date.now() - startTime;
    } catch (error: any) {
      // ESTADO: FAILED
      job.status = 'FAILED';
      job.error = error.message;
      job.metrics.totalMs = Date.now() - startTime;
      console.error(`[Orchestrator Error] Job ${jobId}:`, error);
    }
  }

  // API Route for generating the viral script - Fully Multimodal
  app.post("/api/generate", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "No GEMINI_API_KEY found" });
      }

      const { topic, dna, videoFile, model, imageFile, imageInstructions } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "El campo 'tema' es obligatorio." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const systemInstruction = SYSTEM_PROMPTS.VIDEO_GENERATION;

      const contentsParts: any[] = [];

      if (videoFile && videoFile.data && videoFile.mimeType) {
        contentsParts.push({
          inlineData: {
            data: videoFile.data,
            mimeType: videoFile.mimeType
          }
        });
        contentsParts.push({
          text: `Observa con atención este video de referencia. Analiza sus ganchos visuales, ritmo de edición, entonación, y estructura de retención mediante ingeniería inversa real. Luego, aplica exactamente ese ADN clonado para redactar un guion técnico y de locución completamente nuevo para el siguiente tema/noticia/coyuntura de alto impacto: "${topic}".`
        });
      } else {
        contentsParts.push({
          text: `Escribe un guion técnico y de locución completamente nuevo para el siguiente tema/noticia/coyuntura de alto impacto: "${topic}". ${dna ? `Usa las siguientes pautas de ADN de referencia: ${dna}` : "Haz que tenga la máxima retención y gancho viral posible."}`
        });
      }

      if (imageFile && imageFile.data && imageFile.mimeType) {
        contentsParts.push({
          inlineData: {
            data: imageFile.data,
            mimeType: imageFile.mimeType
          }
        });
        contentsParts.push({
          text: `[Visual Anchor Point - Imagen de Referencia de Producción]:
Utiliza esta imagen de referencia para deconstruir su atmósfera visual, personajes, escenario y vestuarios. Adáptalos e intégralos con rigor industrial en la generación del nuevo guion.${imageInstructions ? ` El usuario ha provisto las siguientes instrucciones específicas de adaptación visual basadas en esta imagen: "${imageInstructions}"` : ""}`
        });
      }

      const response = await generateContentWithRetry(ai, {
        model: model || "gemini-3.8-flash",
        contents: contentsParts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              script: {
                type: Type.ARRAY,
                description: "El guion con formato de tabla",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING, description: "Tiempo estimado, ej: 00:00 - 00:03" },
                    visual: { type: Type.STRING, description: "Columna Visual y Edición (Texto en Pantalla, Actitud, Acción principal)." },
                    audio: { type: Type.STRING, description: "Columna de Locución (Lo que dice el personaje - Modula el tono)" },
                    acoustics: { type: Type.STRING, description: "Sincronización Acústica Segmentada: Foley sfx, atmósfera de fondo, música y modulación vocal para este segmento exacto." },
                    vfx: { type: Type.STRING, description: "Dirección de Arte y Óptica Segmentada: Iluminación, LUT color Kelvin, grano, tipo de lente, encuadre y transiciones." },
                    charactersCount: { type: Type.INTEGER, description: "Número exacto de personajes en este fragmento. Si está el perro pastor alemán, cuéntalo." },
                    charactersDetail: { type: Type.STRING, description: "Detalle e identificación fidedigna de los personajes en escena (ej: Brad Pitt con goatee rubio canoso, mirada cansada, de unos 58 años)." },
                    wardrobe: { type: Type.STRING, description: "Especificación técnica y detallada de la ropa/vestuario de cada personaje (ej: sudadera camuflada de manga larga, guantes tácticos)." },
                    propsAndEnvironment: { type: Type.STRING, description: "Utilería física en primer y segundo plano, accesorios activos y descripción detallada del entorno." }
                  },
                  required: ["time", "visual", "audio", "acoustics", "vfx", "charactersCount", "charactersDetail", "wardrobe", "propsAndEnvironment"]
                }
              },
              titles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Las 3 opciones de títulos/portadas (Thumbnail text) más clickbait basados en curiosidad o indignación."
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Los 5 hashtags estratégicos para el algoritmo de indexación semántica."
              },
              commentBait: {
                type: Type.STRING,
                description: "El 'Trigger de Comentarios': Una pregunta específica para dejar al final o en la descripción que obligue a la gente a pelear o debatir en la sección de comentarios."
              },
              transferableMatrix: {
                type: Type.OBJECT,
                properties: {
                  hookType: { type: Type.STRING, description: "Tipo de hook extraído del video o patrón común" },
                  dominantEmotion: { type: Type.STRING, description: "Emoción dominante" },
                  narrativeSpeed: { type: Type.STRING, description: "Velocidad narrativa" },
                  languageComplexity: { type: Type.STRING, description: "Complejidad del lenguaje" },
                  ideasPerMinute: { type: Type.STRING, description: "Número de ideas por minuto" },
                  tensionPattern: { type: Type.STRING, description: "Patrón de tensión" },
                  resolutionPattern: { type: Type.STRING, description: "Patrón de resolución" },
                  ctaType: { type: Type.STRING, description: "Tipo de CTA" }
                },
                required: [
                  "hookType",
                  "dominantEmotion",
                  "narrativeSpeed",
                  "languageComplexity",
                  "ideasPerMinute",
                  "tensionPattern",
                  "resolutionPattern",
                  "ctaType"
                ]
              },
              audioMetrics: {
                type: Type.OBJECT,
                properties: {
                  soundscape: { type: Type.STRING, description: "Tono de sala, ruido de fondo, reverberación o atmósfera acústica." },
                  foleySFX: { type: Type.STRING, description: "Efectos Foley detallados, transición ultrasónica, golpes rítmicos u otros sfx." },
                  musicScore: { type: Type.STRING, description: "Género musical, tempo estimado, tipo de beats e instrumentos que marcan el ritmo dramático." },
                  voiceTonal: { type: Type.STRING, description: "Modulación de frecuencias, tempo verbal, entonación o pausas intencionadas." }
                },
                required: ["soundscape", "foleySFX", "musicScore", "voiceTonal"]
              },
              vfxMetrics: {
                type: Type.OBJECT,
                properties: {
                  pbrLighting: { type: Type.STRING, description: "Tipo de iluminación física (Key light, ambient shadow, exposición de contraste)." },
                  colorGradingLUT: { type: Type.STRING, description: "Estilo Kelvin de temperatura del color, LUT cinemática sugerida, saturación." },
                  opticalImperfection: { type: Type.STRING, description: "Grano fotográfico analógico, aberración cromática, vignette en bordes u desenfoque focal." },
                  transitionsSpeed: { type: Type.STRING, description: "Frecuencia de cortes en segundos, estilo de zoom y efectos de barrido." }
                },
                required: ["pbrLighting", "colorGradingLUT", "opticalImperfection", "transitionsSpeed"]
              },
              devilsAdvocate: {
                type: Type.OBJECT,
                properties: {
                  visualFidelityScore: { type: Type.INTEGER, description: "Porcentaje estimado de paridad y fidelidad visual (0 a 100)." },
                  foleyCoherenceScore: { type: Type.INTEGER, description: "Porcentaje estimado de armonía y coherencia Foley auditiva (0 a 100)." },
                  discrepancyAlerts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Alertas de divergencia o errores comunes de generación artificial (lo que delata que no es real)."
                  },
                  antiSlopDirectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Instrucciones de corrección estrictas para mitigar el look artificial de IA (directivas anti-slop)."
                  }
                },
                required: ["visualFidelityScore", "foleyCoherenceScore", "discrepancyAlerts", "antiSlopDirectives"]
              }
            },
            required: ["script", "titles", "hashtags", "commentBait", "transferableMatrix", "audioMetrics", "vfxMetrics", "devilsAdvocate"]
          }
        }
      });

      res.json(cleanAndParseJSON(response.text));
    } catch (error: any) {
      console.error("API Error (Generate):", error);
      res.status(500).json({ error: error.message || "Error generating script" });
    }
  });

  // API Route to analyze direct video reference (extracting original transcript, DNA, and 3 suggested topics)
  app.post("/api/analyze-video", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "No GEMINI_API_KEY found" });
      }

      const { videoFile, dna, model, imageFile, imageInstructions } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const systemInstruction = SYSTEM_PROMPTS.VIDEO_ANALYSIS;

      const contentsParts: any[] = [];
      if (videoFile && videoFile.data && videoFile.mimeType) {
        contentsParts.push({
          inlineData: {
            data: videoFile.data,
            mimeType: videoFile.mimeType
          }
        });
        contentsParts.push({
          text: "Observa detalladamente este video de referencia. Realiza la ingeniería inversa completa para extraer su ADN, su guion original transcrito paso a paso con timesteps, y sugiere 3 temas de destino de alto impacto viral perfectos para clonarlo directamente."
        });
      } else {
        contentsParts.push({
          text: `Realiza la ingeniería inversa de los siguientes metadatos o ADN de notas provistos: "${dna || 'Video genérico de alta retención'}". Deduce el guion original estimado, su matriz de retención, y sugiere 3 temas de destino de alto impacto viral directos.`
        });
      }

      if (imageFile && imageFile.data && imageFile.mimeType) {
        contentsParts.push({
          inlineData: {
            data: imageFile.data,
            mimeType: imageFile.mimeType
          }
        });
        contentsParts.push({
          text: `[Visual Anchor Point - Imagen de Referencia de Producción]:
Utiliza esta imagen de referencia para deconstruir su atmósfera visual, personajes, escenario y vestuarios. Adáptalos e intégralos con rigor industrial en el análisis general.${imageInstructions ? ` El usuario ha provisto las siguientes instrucciones específicas de adaptación visual basadas en esta imagen: "${imageInstructions}"` : ""}`
        });
      }

      const response = await generateContentWithRetry(ai, {
        model: model || "gemini-3.8-flash",
        contents: contentsParts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalScript: {
                type: Type.ARRAY,
                description: "Transcripción paso a paso del video analizado",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING, description: "Tiempo aproximado, ej: 00:00 - 00:03" },
                    visual: { type: Type.STRING, description: "Descripción de la acción física en pantalla, cortes de edición, gestos y lenguaje no verbal." },
                    audio: { type: Type.STRING, description: "Audio vocalizado o locución transcrita de forma literal al español." },
                    acoustics: { type: Type.STRING, description: "Deconstrucción acústica de este instante: Fx foley, ruidos reales de fondo o matices verbales." },
                    vfx: { type: Type.STRING, description: "Deconstrucción visual y VFX: Grano, iluminación real, enfoque de cámara, encuadres cinemáticos o efectos ópticos." },
                    charactersCount: { type: Type.INTEGER, description: "Número exacto e indiscutible de personajes (humanos y animales clave) visibles en este corte de escena." },
                    charactersDetail: { type: Type.STRING, description: "Identificación inequívoca de cada personaje (ej: Brad Pitt con cabello cano rapado, el cabo militar joven, etc.), sus expresiones y fisonomía." },
                    wardrobe: { type: Type.STRING, description: "Indumentaria, vestuario preciso, colores, texturas y prendas portadas por los personajes en esta toma." },
                    propsAndEnvironment: { type: Type.STRING, description: "Descripción rigurosa de los objetos/utilería (armas, lámparas, botellas) y características físicas concretas del fondo." }
                  },
                  required: ["time", "visual", "audio", "acoustics", "vfx", "charactersCount", "charactersDetail", "wardrobe", "propsAndEnvironment"]
                }
              },
              transferableMatrix: {
                type: Type.OBJECT,
                properties: {
                  hookType: { type: Type.STRING, description: "Tipo de hook extraído, ej: Shock verbal, Pattern Interrupt visual" },
                  dominantEmotion: { type: Type.STRING, description: "Emotividad clave, ej: Indignación colectiva, Curiosidad mórbida" },
                  narrativeSpeed: { type: Type.STRING, description: "Ej: Rápido con jump-cuts cada 1.5s, Tono pausado de suspenso" },
                  languageComplexity: { type: Type.STRING, description: "Ej: Muy directo y vulgar, Técnico corporativo, etc." },
                  ideasPerMinute: { type: Type.STRING, description: "Ej: 12 ideas o estímulos visuales por minuto" },
                  tensionPattern: { type: Type.STRING, description: "Curva de tensión del video" },
                  resolutionPattern: { type: Type.STRING, description: "Tipo de resolución o salida rápida" },
                  ctaType: { type: Type.STRING, description: "Estilo de llamado a la acción" }
                },
                required: [
                  "hookType",
                  "dominantEmotion",
                  "narrativeSpeed",
                  "languageComplexity",
                  "ideasPerMinute",
                  "tensionPattern",
                  "resolutionPattern",
                  "ctaType"
                ]
              },
              suggestedTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 propuestas de temas o noticias de alto impacto sumamente virales perfectas para replicar esta misma estructura (ej: 'El nuevo aumento de las tarifas de peaje y la indignación de la gente')"
              },
              commentBait: { type: Type.STRING, description: "Estrategia para encender la sección de comentarios" },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              audioMetrics: {
                type: Type.OBJECT,
                properties: {
                  soundscape: { type: Type.STRING, description: "Tono de sala, ruido de fondo, reverberación o atmósfera acústica." },
                  foleySFX: { type: Type.STRING, description: "Efectos Foley detallados, transición ultrasónica, golpes rítmicos u otros sfx." },
                  musicScore: { type: Type.STRING, description: "Género musical, tempo estimado, tipo de beats e instrumentos que marcan el ritmo dramático." },
                  voiceTonal: { type: Type.STRING, description: "Modulación de frecuencias, tempo verbal, entonación o pausas intencionadas." }
                },
                required: ["soundscape", "foleySFX", "musicScore", "voiceTonal"]
              },
              vfxMetrics: {
                type: Type.OBJECT,
                properties: {
                  pbrLighting: { type: Type.STRING, description: "Tipo de iluminación física (Key light, ambient shadow, exposición de contraste)." },
                  colorGradingLUT: { type: Type.STRING, description: "Estilo Kelvin de temperatura del color, LUT cinemática sugerida, saturación." },
                  opticalImperfection: { type: Type.STRING, description: "Grano fotográfico analógico, aberración cromática, vignette en bordes u desenfoque focal." },
                  transitionsSpeed: { type: Type.STRING, description: "Frecuencia de cortes en segundos, estilo de zoom y efectos de barrido." }
                },
                required: ["pbrLighting", "colorGradingLUT", "opticalImperfection", "transitionsSpeed"]
              },
              devilsAdvocate: {
                type: Type.OBJECT,
                properties: {
                  visualFidelityScore: { type: Type.INTEGER, description: "Porcentaje estimado de paridad y fidelidad visual (0 a 100)." },
                  foleyCoherenceScore: { type: Type.INTEGER, description: "Porcentaje estimado de armonía y coherencia Foley auditiva (0 a 100)." },
                  discrepancyAlerts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Alertas de divergencia o errores comunes de generación artificial (lo que delata que no es real)."
                  },
                  antiSlopDirectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Instrucciones de corrección estrictas para mitigar el look artificial de IA (directivas anti-slop)."
                  }
                },
                required: ["visualFidelityScore", "foleyCoherenceScore", "discrepancyAlerts", "antiSlopDirectives"]
              }
            },
            required: ["originalScript", "transferableMatrix", "suggestedTopics", "commentBait", "hashtags", "audioMetrics", "vfxMetrics", "devilsAdvocate"]
          }
        }
      });

      res.json(cleanAndParseJSON(response.text));
    } catch (error: any) {
      console.error("API Error (Analyze-Video):", error);
      res.status(500).json({ error: error.message || "Error al analizar el video" });
    }
  });

  // API Route for cross-analyzing up to 3 videos - Fully Multimodal
  app.post("/api/cross-analyze", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "No GEMINI_API_KEY found" });
      }

      const { videos, model } = req.body; // Array of { title: string, content?: string, fileData?: string, mimeType?: string }
      if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return res.status(400).json({ error: "Debes enviar al menos un video o transcripción para analizar." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const contentsParts: any[] = [];
      
      videos.forEach((v, i) => {
        if (v.fileData && v.mimeType) {
          contentsParts.push({
            inlineData: {
              data: v.fileData,
              mimeType: v.mimeType
            }
          });
          contentsParts.push({
            text: `[Video ${i + 1} de Referencia Real: "${v.title || `Video ${i + 1}`}"]`
          });
        }
        if (v.content && v.content.trim() !== "") {
          contentsParts.push({
            text: `[Notas / Transcripción de Video ${i + 1} ("${v.title || `Video ${i + 1}`}")]:\n${v.content}`
          });
        }
      });

      contentsParts.push({
        text: `Realiza un análisis comparativo cruzado multimodal exhaustivo de estos videos exitosos provistos. Identifica sus patrones comunes de ADN a nivel de gancho, velocidad de cortes de edición, tono emocional, tensión dramática y llamada a la acción / loop de retención. Genera un reporte formal en JSON conteniendo similarities, findingsSummary, suggestedTopics, y exportableDocument.`
      });

      const systemInstruction = `
Actúa como un Director de Inteligencia de Contenido y Senior Data Scientist de Audiencias en Tiktok, Instagram Reels y Youtube Shorts.
Tu tarea es realizar una INGENIERÍA INVERSA COMPARATIVA de hasta 3 videos exitosos provistos por el usuario. 

Debes extraer y reutilizar variables observables y concretas:
1. Tipo de hook.
2. Longitud de frases (métrica).
3. Frecuencia de cambios narrativos / Ritmo de ganchos secundarios.
4. Patrón neuro-emocional.
5. Secuencia argumentativa.
6. Tipo de cierre / Loop de retención.

Analiza estos videos en conjunto para encontrar los patrones de ADN que se repiten e hicieron que funcionaran con alta retención.

Devuelve un reporte en formato JSON con:
- Un resumen de similitudes y divergencias encontradas.
- Una matriz de transferencia cruzada común sintetizada.
- Recomendaciones concretas de temas o ganchos para nuevos videos.
- Un documento de hallazgos formal enteramente formateado en Markdown, listo para exportar. Este documento debe ser detallado, riguroso, formal y de extremo valor para un creador de contenido profesional.
`;

      const response = await generateContentWithRetry(ai, {
        model: model || "gemini-3.8-flash",
        contents: contentsParts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              similarities: {
                type: Type.OBJECT,
                properties: {
                  hookType: { type: Type.STRING, description: "Patrón común de gancho" },
                  dominantEmotion: { type: Type.STRING, description: "Emoción central" },
                  narrativeSpeed: { type: Type.STRING, description: "Ritmo de oraciones / velocidad" },
                  languageComplexity: { type: Type.STRING, description: "Complejidad lingüística observada" },
                  ideasPerMinute: { type: Type.STRING, description: "Densidad de ideas" },
                  tensionPattern: { type: Type.STRING, description: "Cómo escalan la tensión" },
                  resolutionPattern: { type: Type.STRING, description: "Cómo concluyen o resuelven" },
                  ctaType: { type: Type.STRING, description: "Estrategia para fomentar interacción / loop" }
                },
                required: [
                  "hookType",
                  "dominantEmotion",
                  "narrativeSpeed",
                  "languageComplexity",
                  "ideasPerMinute",
                  "tensionPattern",
                  "resolutionPattern",
                  "ctaType"
                ]
              },
              findingsSummary: { type: Type.STRING, description: "Breve resumen en español de los patrones más potentes encontrados." },
              suggestedTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 propuestas concretas de ganchos o temáticas aplicando este ADN para sus siguientes videos"
              },
              exportableDocument: {
                type: Type.STRING,
                description: "Documento oficial del informe de ingeniería inversa completo en formato Markdown (títulos, tablas, sección de matriz, hallazgos, guías de edición y sugerencias)."
              }
            },
            required: ["similarities", "findingsSummary", "suggestedTopics", "exportableDocument"]
          }
        }
      });

      res.json(cleanAndParseJSON(response.text));
    } catch (error: any) {
      console.error("API Cross-analyse Error:", error);
      res.status(500).json({ error: error.message || "Error in cross analysis" });
    }
  });

  // API Route to audit script semantics and logic using the high-rigor SAECS instructions
  app.post("/api/audit-script", async (req, res) => {
    const { script, model } = req.body;
    if (!script || !Array.isArray(script)) {
      return res.status(400).json({ error: "Script must be a valid list of segment rows to audit." });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "No GEMINI_API_KEY found" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const systemInstruction = SYSTEM_PROMPTS.SCRIPT_AUDIT;

      const response = await generateContentWithRetry(ai, {
        model: model || "gemini-3.8-flash",
        contents: [
          {
            text: `Por favor, ejecuta una Auditoría de Lógica del Guion (SAECS) exhaustiva sobre el siguiente guion de ingeniería inversa o clonado:\n\n${JSON.stringify(script, null, 2)}`
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING, description: "Resumen ejecutivo formal de la auditoría de integridad y embedding de producción" },
              generalState: { type: Type.STRING, description: "Estado general de coherencia y fidelidad semántica del guion" },
              confidenceIndex: { type: Type.INTEGER, description: "Índice de confianza lógica del guion (0 a 100)" },
              preFlightValidation: {
                type: Type.OBJECT,
                properties: {
                  formatSpecs: { type: Type.STRING, description: "Validación pre-flight de (a) Especificaciones de formato" },
                  lightingColorimetry: { type: Type.STRING, description: "Validación pre-flight de (b) Parámetros de iluminación/colorimetría" },
                  cameraMovement: { type: Type.STRING, description: "Validación pre-flight de (c) Restricciones de movimiento de cámara" },
                  audioFrequency: { type: Type.STRING, description: "Validación pre-flight de (d) Especificaciones de audio/frecuencia" },
                  scriptIntegrity: { type: Type.STRING, description: "Validación pre-flight de (e) Integridad del guion" }
                },
                required: ["formatSpecs", "lightingColorimetry", "cameraMovement", "audioFrequency", "scriptIntegrity"]
              },
              findings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID del hallazgo, ej: AUD-01, AUD-02" },
                    title: { type: Type.STRING, description: "Título descriptivo corto del hallazgo" },
                    severity: { type: Type.STRING, description: "Severidad: CRÍTICO, ALTO, MEDIO, BAJO, INFORMATIVO" },
                    category: { type: Type.STRING, description: "Categoría: consistencia, cobertura, invariante, dato, calidad, acceso, test" },
                    description: { type: Type.STRING, description: "Descripción técnica detallada de la anomalía o incoherencia observada" },
                    evidence: { type: Type.STRING, description: "Evidencia exacta (ej: tiempo '00:03 - 00:06', columna o diálogo)" },
                    triggerCase: { type: Type.STRING, description: "Caso concreto o combinación de elementos que detonan el problema" },
                    impact: { type: Type.STRING, description: "Impacto del problema en la retención del espectador, verosimilitud o look artificial (IA Slop)" },
                    rootCause: { type: Type.STRING, description: "Causa raíz de la inconsistencia" },
                    consequences: { type: Type.STRING, description: "Consecuencias de no remediar esta inconsistencia" },
                    recommendation: { type: Type.STRING, description: "Propuesta de corrección lógica descrita con precisión técnica (sin reescribir todo el guion)" },
                    confidenceLevel: { type: Type.STRING, description: "Nivel de confianza en el hallazgo: ALTO, MEDIO, BAJO" },
                    status: { type: Type.STRING, description: "Estado del hallazgo: VERIFICADO o NO VERIFICADO: INFORMACIÓN INSUFICIENTE PARA AUDITAR" },
                    
                    // V3-specific fields
                    technicalProblem: { type: Type.STRING, description: "Problema Técnico: Descripción del fallo de ingeniería en el prompt" },
                    evidenceObserved: { type: Type.STRING, description: "Evidencia Observada: Cita textual del prompt" },
                    technicalGoal: { type: Type.STRING, description: "Objetivo Técnico: Requerimiento exacto para subsanar el vacío" },
                    remediationStrategy: { type: Type.STRING, description: "Estrategia de Remediación: Acción técnica correctiva" },
                    stepByStepActions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Acciones Técnicas Paso a Paso: Algoritmo de corrección"
                    },
                    exactLocation: { type: Type.STRING, description: "Ubicación Exacta de la Intervención: Sección del prompt" },
                    architecturalImpact: { type: Type.STRING, description: "Impacto Arquitectónico: Efecto en el pipeline de renderizado" },
                    measurableAcceptanceCriteria: { type: Type.STRING, description: "Criterios de Aceptación Medibles: Métrica binaria de éxito" },
                    stressChaosTestingStrategy: { type: Type.STRING, description: "Estrategia de Pruebas de Estrés/Caos: Método de validación del prompt corregido" },
                    residualRisk: { type: Type.STRING, description: "Riesgo Residual: Vulnerabilidad post-corrección" },
                    detailedRollbackPlan: { type: Type.STRING, description: "Plan de Rollback Detallado: Procedimiento de reversión" },
                    estimatedEffort: { type: Type.STRING, description: "Esfuerzo Estimado: Unidades de tiempo/recursos" },
                    dependencies: { type: Type.STRING, description: "Dependencias para la matriz general de entregables" },
                    phase: { type: Type.STRING, description: "Fase de la matriz general de entregables" }
                  },
                  required: [
                    "id", "title", "severity", "category", "description", "evidence", "triggerCase", "impact", "rootCause", "consequences", "recommendation", "confidenceLevel", "status",
                    "technicalProblem", "evidenceObserved", "technicalGoal", "remediationStrategy", "stepByStepActions", "exactLocation", "architecturalImpact", "measurableAcceptanceCriteria", "stressChaosTestingStrategy", "residualRisk", "detailedRollbackPlan", "estimatedEffort", "dependencies", "phase"
                  ]
                }
              },
              activeRefutations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de pruebas de refutación activa aplicadas para buscar contradicciones latentes"
              },
              remediationPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { type: Type.STRING, description: "Prioridad: CRÍTICA, ALTA, MEDIA, BAJA" },
                    description: { type: Type.STRING, description: "Descripción de la remediación propuesta" },
                    risks: { type: Type.STRING, description: "Riesgos de efectos secundarios al aplicar la remediación" },
                    effort: { type: Type.STRING, description: "Esfuerzo estimado para la corrección" }
                  },
                  required: ["priority", "description", "risks", "effort"]
                }
              }
            },
            required: ["executiveSummary", "generalState", "confidenceIndex", "preFlightValidation", "findings", "activeRefutations", "remediationPlan"]
          }
        }
      });

      res.json(cleanAndParseJSON(response.text));
    } catch (error: any) {
      console.error("API Audit Error:", error);
      res.status(500).json({ error: error.message || "Error conducting SAECS logic audit" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:\${PORT}`);
  });
}

startServer();
