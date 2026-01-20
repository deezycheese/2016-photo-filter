
import { GoogleGenAI } from "@google/genai";

export const enhancePhotoWithAI = async (base64Image: string, styleDescription: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `Professional high-end digital camera color grading. 
            Apply a specific 'Retro Sunset' aesthetic: 
            1. Shadows must have a deep purple/indigo tint.
            2. Highlights must be warm, glowing, and slightly overexposed (bloomed).
            3. Overall saturation should be very high, especially in yellows, oranges, and teals.
            4. Add a subtle vintage lens flare or light leak if it fits the composition.
            5. Texture should be clean but with a hint of digital sensor noise characteristic of 2005-era premium cameras.
            Style: ${styleDescription}.
            Return ONLY the modified image.`,
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("AI Enhancement failed:", error);
    return null;
  }
};
