const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (error) {
  console.log("Failed to initialize GoogleGenerativeAI. Please make sure GEMINI_API_KEY is set in .env");
}

const askTutor = async (req, res) => {
  try {
    const { message, level, subject } = req.body;
    const document = req.file;
    
    if (!genAI) {
      return res.status(500).json({ error: 'AI model not configured correctly on server.' });
    }
    
    let documentContext = "";
    if (document) {
      if (document.mimetype === 'application/pdf') {
        const data = await pdfParse(document.buffer);
        documentContext = `\n\n--- DOCUMENT CONTEXT START ---\n${data.text.substring(0, 10000)}\n--- DOCUMENT CONTEXT END ---\n`;
      } else {
        // Can add more formats like DOCX later
        documentContext = `\n\n[A document was uploaded but its format is not entirely supported for deeply nested text extraction yet. Try sending a PDF.]\n`;
      }
    }
    
    // Construct prompt
    const systemInstruction = `You are StudyBuddy AI, an expert tutor for the Malawi curriculum (${level || 'MSCE'} level) specialized in ${subject || 'all subjects'}. Respond clearly and encourage the user.` + documentContext;
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction });

    const result = await model.generateContent(message);
    const response = await result.response;
    
    res.json({ answer: response.text() });
  } catch (error) {
    console.error("AI Tutor Error:", error);
    res.status(500).json({ error: 'Failed to process AI request', details: error.message });
  }
};

module.exports = { askTutor };
