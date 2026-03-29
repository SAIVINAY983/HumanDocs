const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AI_KEY_PLACEHOLDER");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const callGemini = async (prompt, text) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please add it to your .env file.");
    }
    const result = await model.generateContent(`${prompt}\n\nText:\n${text}`);
    const response = await result.response;
    return response.text();
};

exports.summarizeText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "No text provided" });
        
        const summary = await callGemini("Summarize the following text clearly and concisely using bullet points:", text);
        res.json({ result: summary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.improveWriting = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "No text provided" });
        
        const improved = await callGemini("Rewrite the following text to make it more professional, engaging, and clear while maintaining the original meaning:", text);
        res.json({ result: improved });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.fixGrammar = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "No text provided" });
        
        const corrected = await callGemini("Fix all grammar, punctuation, and spelling errors in the following text. Return ONLY the corrected text:", text);
        res.json({ result: corrected });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
