require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3033;
const MODEL_NAME = 'gemini-pro-vision';
const API_KEY = process.env.GEMINI_API_KEY;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const parts = [
      { 
       text:'ตรวจสอบรูปภาพว่าเป็นภาพลายมือหรือฝ่ามือของมนุษย์ก็ได้หรือไม่ ถ้าใช่ ให้ทำนายลายมือ อ่านลายมือโหราศาสตร์ ถ้าไม่ใช่ให้บอกว่าไม่ใช่ภาพลายมือ และอธิบายภาพนี้อย่างละเอียดมีอะไรบ้าง'
     },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: req.file.buffer.toString('base64'),
        },
      },
    ];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.text();
    console.log(responseText);

    // Send the result as part of the HTTP response
    res.status(200).json({ result: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
