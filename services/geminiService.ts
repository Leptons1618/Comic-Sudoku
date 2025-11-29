import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SudokuGrid } from "../types";

let customApiKey: string | null = null;

export const setCustomApiKey = (key: string) => {
  customApiKey = key;
};

// Initialize lazily or safely
const getAiClient = () => {
  const apiKey = customApiKey || process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing!");
    throw new Error("Gemini API Key is missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

const sudokuSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    board: {
      type: Type.ARRAY,
      description: "A 9x9 array representing the sudoku grid. Use 0 for empty cells.",
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.INTEGER,
          description: "A number between 0 and 9",
        },
      },
    },
  },
  required: ["board"],
};

export const extractSudokuFromImage = async (base64Image: string): Promise<SudokuGrid> => {
  try {
    const response = await getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this image of a Sudoku puzzle. Extract the numbers into a 9x9 grid. Represent empty cells with 0. Ensure high accuracy.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: sudokuSchema,
        systemInstruction: "You are an expert OCR system specialized in recognizing Sudoku grids. You extract only the numbers visible on the board.",
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Validate that we actually got a 9x9 grid
      if (Array.isArray(data.board) && data.board.length === 9 && data.board.every((r: any) => Array.isArray(r) && r.length === 9)) {
        return data.board as SudokuGrid;
      }
    }
    throw new Error("Invalid response format from Gemini");
  } catch (error) {
    console.error("Error extracting sudoku:", error);
    throw error;
  }
};