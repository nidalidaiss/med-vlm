import { AnalysisResult } from "./types.ts";
import { FunctionDeclaration, Type } from "@google/genai";

export const SYSTEM_INSTRUCTION_MEDICAL = `
You are the Lead Medical VLM (Vision-Language Model) Agent using Gemini 3 Flash. 
Your role is to act as a Consultant Radiologist.

1.  **Analyze** the provided medical image (X-ray, MRI, CT, Ultrasound, or Pathology) or Volumetric Video Sequence.
2.  **Identify** pathologies.
3.  **Check for Anatomical Changes:**
    *   **Displacement:** If an organ is pushed out of its normal position (mass effect), IDENTIFY and SEGMENT it. Label it as "Displaced [Organ Name]".
    *   **Size Change:** If an organ is enlarged (hepatomegaly, cardiomegaly) or atrophied, IDENTIFY and SEGMENT it. Label it as "Enlarged/Atrophied [Organ Name]".
4.  **Localize** findings:
    *   Use **Bounding Boxes** for all findings.
    *   **CRITICAL:** For irregular shapes (masses, tumors, organs, fluid pockets), also provide a **Polygon** (list of x,y points) to create a precise segmentation mask.
5.  **Risk Assessment**:
    *   **High Risk (Red):** Malignant masses, acute bleeds, severe fractures.
    *   **Moderate Risk (Yellow):** Benign-appearing nodules, mild degeneration, organ displacement.
    *   **Fluid/Edema (Blue):** Effusions, cysts, edema.
6.  **Report** in professional medical English:
    *   **Clinical Indication**
    *   **Technique**
    *   **Findings**
    *   **AI-Driven Impression** (including Differential Diagnoses)
    *   **ICD-11/RADS**

7. **Sensitivity Settings:**
   *   **High:** Flag all anomalies. High recall.
   *   **Low:** Only definitive pathologies. High specificity.
   *   **Standard:** Balanced.

Your response MUST be a JSON object matching this schema:
{
  "report": "Full markdown text...",
  "findings": [
    {
      "label": "Short name",
      "severity": "high" | "moderate" | "fluid",
      "coordinates": { "ymin": 0-1000, "xmin": 0-1000, "ymax": 0-1000, "xmax": 0-1000 },
      "polygon": [{"x": 0-1000, "y": 0-1000}, ...], 
      "description": "Brief description"
    }
  ]
}

Coordinates Scale: 0-1000 (0,0 is top-left, 1000,1000 is bottom-right).
`;

export const HIGHLIGHT_ANATOMY_TOOL: FunctionDeclaration = {
  name: 'highlight_anatomy',
  description: 'Highlight or segment a specific anatomical structure or pathology on the image based on user request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING, description: 'Name of the structure (e.g., Liver, Aorta, Tumor)' },
      severity: { type: Type.STRING, enum: ['high', 'moderate', 'fluid', 'low'], description: 'Risk level for coloring' },
      ymin: { type: Type.NUMBER, description: 'Top coordinate (0-1000)' },
      xmin: { type: Type.NUMBER, description: 'Left coordinate (0-1000)' },
      ymax: { type: Type.NUMBER, description: 'Bottom coordinate (0-1000)' },
      xmax: { type: Type.NUMBER, description: 'Right coordinate (0-1000)' },
      polygon: {
        type: Type.ARRAY,
        description: 'Optional list of points for polygon segmentation',
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
    required: ['label', 'severity', 'ymin', 'xmin', 'ymax', 'xmax']
  }
};

export const PYTHON_AGENT_SCRIPT = `
import cv2
import numpy as np
from PIL import Image

class MedicalVLMAgent:
    def __init__(self, model_name="gemini-3-flash"):
        self.model = model_name

    def preprocess_image(self, image_path):
        """
        Simulated "Multi-Step Look" preprocessing.
        1. Load image
        2. Normalize intensity (CLAHE)
        3. Identify ROI (Region of Interest)
        """
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        # to see through dense tissues (Window/Leveling simulation)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced_img = clahe.apply(img)
        
        return enhanced_img

    def detect_suspicious_clusters(self, image_array, sensitivity='standard'):
        """
        Identify high-intensity clusters that might indicate calcifications or bleeding.
        Adjusts threshold based on sensitivity.
        """
        threshold_val = 200
        if sensitivity == 'high':
            threshold_val = 180 # Lower threshold to catch more
        elif sensitivity == 'low':
            threshold_val = 220 # Higher threshold to be more specific

        blurred = cv2.GaussianBlur(image_array, (5, 5), 0)
        _, thresh = cv2.threshold(blurred, threshold_val, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        suspicious_regions = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w > 10 and h > 10: # Filter small noise
                suspicious_regions.append((x, y, w, h))
                
        return suspicious_regions

    def generate_report(self, image, findings):
        """
        Compose final radiology report based on visual findings.
        """
        # Logic to compile findings into structured text
        pass

# This script represents the internal logic the agent uses for
# pre-processing before visual analysis.
`;

export const MOCK_PATIENTS = [
  { id: 'PT-1092', name: 'Sarah Connor', age: 45, gender: 'F', lastScan: '2023-10-24', modality: 'MRI Brain', status: 'critical' },
  { id: 'PT-1093', name: 'James Howlett', age: 132, gender: 'M', lastScan: '2023-10-25', modality: 'X-Ray Chest', status: 'stable' },
  { id: 'PT-1094', name: 'Wade Wilson', age: 35, gender: 'M', lastScan: '2023-10-26', modality: 'CT Abdomen', status: 'review' },
];