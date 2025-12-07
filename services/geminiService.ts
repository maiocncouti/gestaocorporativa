import { GoogleGenAI } from "@google/genai";

// NOTE: In a real production app, never expose API keys on the client side.
// This is for demonstration using the provided environment variable pattern.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateSummary = async (fileName: string, fileType: string): Promise<string> => {
  if (!apiKey) return "Descrição automática indisponível (Sem API Key).";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Crie um resumo curto e profissional em português para um arquivo corporativo chamado "${fileName}" do tipo "${fileType}". Invente um contexto plausível de menu ou comunicado interno. Máximo 20 palavras.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Sem descrição gerada.";
  } catch (error) {
    console.error("Erro ao gerar resumo Gemini:", error);
    return "Erro ao gerar descrição.";
  }
};

export const chatWithBot = async (history: string[], message: string): Promise<string> => {
    if (!apiKey) return "O Chatbot está indisponível no momento.";
    
    try {
        const prompt = `Você é um assistente de RH útil e amigável da empresa.
        
        Histórico da conversa:
        ${history.join('\n')}
        
        Usuário: ${message}
        
        Responda em português de forma concisa e útil.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Using Pro for better reasoning in chat
            contents: prompt,
        });

        return response.text || "Desculpe, não entendi.";

    } catch (error) {
        console.error("Erro no chat:", error);
        return "Tive um problema ao processar sua mensagem.";
    }
}
