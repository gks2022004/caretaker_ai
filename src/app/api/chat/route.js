import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.API_KEY });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const chatCompletion = await getGroqChatCompletion(req.body.message || "Explain the importance of fast language models");
      res.status(200).json({ message: chatCompletion.choices[0]?.message?.content || "No response from model" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch completion", details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getGroqChatCompletion(content) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: content,
      },
    ],
    model: "llama3-8b-8192",
  });
}
