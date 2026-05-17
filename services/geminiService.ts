import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateInvoiceFromPrompt = async (
  prompt: string,
  currentData: InvoiceData
): Promise<Partial<InvoiceData>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an intelligent invoice parser.
      
      User Input:
      "${prompt}"
      
      Instructions:
      1. Extract line items, costs, and descriptions from the text.
      2. IGNORE "Subtotal" and "Total" rows that just sum up previous items. Only include the individual line items.
      3. CRITICAL: Convert all amounts to pure numbers. Remove currency symbols (e.g. ₦, $, £) and commas. Example: "₦150,000" must become 150000.
      4. If a description is missing, infer it from the item name or leave it empty.
      5. Categorize items as 'Service' or 'Optional'. Default to 'Service'.
      6. Extract 'Notes' and 'Payment Terms' if they appear in the text.
      7. Use the Current Context for fallback values (e.g. currency symbol) if not found in the text.
      8. Format all extracted dates as YYYY-MM-DD.

      Current Context:
      Currency: ${currentData.currency}
      From: ${currentData.fromName}
      To: ${currentData.toName}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNo: { type: Type.STRING },
            date: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            fromName: { type: Type.STRING },
            fromAddress: { type: Type.STRING },
            fromContact: { type: Type.STRING },
            toName: { type: Type.STRING },
            toAddress: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING, enum: ["Service", "Optional"] },
                },
              },
            },
            notes: { type: Type.STRING },
            paymentTerms: { type: Type.STRING },
          },
        },
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean potential markdown code blocks if present
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    
    return JSON.parse(text) as Partial<InvoiceData>;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};