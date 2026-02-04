import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SensitivityLevel, ResearchResult, Finding } from "../types";
import { SYSTEM_INSTRUCTION_MEDICAL, HIGHLIGHT_ANATOMY_TOOL } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeMedicalImage = async (
  base64Data: string, 
  mimeType: string = 'image/png',
  sensitivity: SensitivityLevel = 'standard'
): Promise<AnalysisResult> => {
  try {
    const promptText = `
      Analyze this medical scan (Image or Volumetric Video). 
      
      SETTINGS:
      - Detection Sensitivity: ${sensitivity.toUpperCase()}
      
      TASKS:
      1. Identify findings based on the sensitivity level.
      2. Check for Organ Displacement or Size Changes (Hepatomegaly, etc) and segment them.
      3. Generate a structured report.
      4. Provide bounding boxes AND polygon segmentation masks for pathologies where possible.
      5. Include a Differential Diagnosis section in the Impression.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_MEDICAL,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            report: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ['high', 'moderate', 'fluid', 'low'] },
                  description: { type: Type.STRING },
                  coordinates: {
                    type: Type.OBJECT,
                    properties: {
                      ymin: { type: Type.NUMBER },
                      xmin: { type: Type.NUMBER },
                      ymax: { type: Type.NUMBER },
                      xmax: { type: Type.NUMBER },
                    },
                    required: ['ymin', 'xmin', 'ymax', 'xmax']
                  },
                  polygon: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                         x: { type: Type.NUMBER },
                         y: { type: Type.NUMBER }
                      },
                      required: ['x', 'y']
                    }
                  }
                },
                required: ['label', 'severity', 'coordinates']
              }
            }
          },
          required: ['report', 'findings']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Analysis Failed", error);
    throw error;
  }
};

export const performMedicalResearch = async (symptom: string): Promise<ResearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use 2.5 Flash for reliable Grounding tools
      contents: `Find the latest medical research papers, clinical trials, and treatment guidelines from 2024-2025 regarding: "${symptom}". 
      Summarize the key findings, potential treatments, and recent breakthroughs.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const summary = response.text || "No research found.";
    
    // Extract sources from grounding metadata
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((s: any) => s !== null) || [];

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map((s:any) => [s.uri, s])).values()) as { title: string; uri: string }[];

    return { summary, sources: uniqueSources };
  } catch (error) {
    console.error("Research Search Failed", error);
    return { summary: "Failed to fetch research data.", sources: [] };
  }
};

export const chatWithRadiologist = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  base64Image?: string,
  mimeType: string = 'image/png'
): Promise<{ text: string, newFindings?: Finding[] }> => {
  try {
    const parts: any[] = [{ text: newMessage }];
    const contents = [];
    
    if (base64Image) {
        contents.push({
            role: 'user',
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: "Here is the patient scan for reference." }
            ]
        });
    }

    history.forEach(msg => {
        contents.push({
            role: msg.role,
            parts: [{ text: msg.text }]
        });
    });

    contents.push({
        role: 'user',
        parts: [{ text: newMessage }]
    });

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: {
            systemInstruction: "You are a specialized Radiologist Copilot. You can answer questions AND if the user asks you to locate/find/show a specific organ or pathology, USE the `highlight_anatomy` tool to draw it on the screen.",
            tools: [{ functionDeclarations: [HIGHLIGHT_ANATOMY_TOOL] }]
        }
    });

    const newFindings: Finding[] = [];
    
    // Check for function calls
    const functionCalls = response.functionCalls;
    if (functionCalls) {
      functionCalls.forEach(call => {
        if (call.name === 'highlight_anatomy') {
          const args = call.args as any;
          newFindings.push({
            label: args.label,
            severity: args.severity,
            coordinates: {
              ymin: args.ymin,
              xmin: args.xmin,
              ymax: args.ymax,
              xmax: args.xmax
            },
            polygon: args.polygon,
            description: "Identified via Copilot"
          });
        }
      });
    }

    return { 
      text: response.text || (newFindings.length > 0 ? "I've highlighted the requested structure on the image." : "I'm not sure."), 
      newFindings 
    };

  } catch (error) {
    console.error("Chat Failed", error);
    throw error;
  }
}