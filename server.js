import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Set up Groq SDK (using OpenAI client)
let openai = null;
if (process.env.GROQ_API_KEY) {
  openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

app.post('/api/qa', async (req, res) => {
  try {
    const { query } = req.body;
    if (!openai) {
      return res.json({
        answer: "I couldn't find any relevant compliance information. (Groq API key not set)",
        sources: []
      });
    }

    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable AI compliance assistant for FinTech AI, specialising in RBI regulations, banking compliance, KYC norms, and Indian financial law.

CRITICAL INSTRUCTIONS:
- Explain things simply, as if you are talking to a normal person (layman).
- Keep your answers VERY concise and to the point.
- Only include information that is absolutely necessary to answer the question. Do not ramble.
- Use bullet points if it makes the answer easier to read quickly.`
        },
        {
          role: 'user',
          content: query
        }
      ]
    });
    
    res.json({
      answer: response.choices[0]?.message?.content || 'No response generated.',
      sources: []
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

app.post('/api/predict-churn', (req, res) => {
  // Simple heuristic based on the ML features (mock)
  let score = 20;
  if (req.body.Age > 50) score += 10;
  if (req.body.Balance === 0) score += 20;
  if (req.body.IsActiveMember === 0) score += 30;
  if (req.body.NumOfProducts > 2) score += 10;
  if (req.body.CreditScore < 600) score += 10;
  
  if (req.body.Geography === 'Germany') score += 15;
  if (req.body.Geography === 'Spain') score -= 5;
  if (req.body.Gender === 'Female') score += 5;
  
  score = Math.max(5, Math.min(95, score));
  res.json({ churn_probability: score / 100.0 });
});

app.post('/api/predict-loan', (req, res) => {
  let score = 50.0;
  const { CreditScore, EstimatedSalary, Balance, Tenure, IsActiveMember } = req.body;
  
  if (CreditScore > 750) score += 30;
  else if (CreditScore > 650) score += 15;
  else if (CreditScore < 500) score -= 30;
  
  if (EstimatedSalary > 100000) score += 10;
  if (Balance > 50000) score += 10;
  if (Balance === 0) score -= 10;
  
  if (Tenure > 5) score += 10;
  if (IsActiveMember === 1) score += 5;
  
  score = Math.max(5, Math.min(95, score));
  res.json({ loan_probability: score / 100.0 });
});

app.post('/api/predict-credit', (req, res) => {
  let score = 50.0;
  const { CreditScore, EstimatedSalary, Balance, NumOfProducts, HasCrCard } = req.body;
  
  score += (CreditScore - 600) / 10.0;
  
  if (EstimatedSalary > 0) {
    const ratio = Balance / EstimatedSalary;
    if (ratio > 2.0) score += 15;
    else if (ratio > 0.5) score += 5;
    else score -= 5;
  }
  
  if (NumOfProducts > 2) score -= 5;
  if (HasCrCard === 1) score += 5;
  
  score = Math.max(0, Math.min(100, score));
  res.json({ credit_score: score });
});

app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});