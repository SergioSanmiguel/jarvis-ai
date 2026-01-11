import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'
import fetch from 'node-fetch' // necesario para llamar webhook n8n

const app = express()
const port = process.env.PORT || 3000

// 🔹 Servir frontend
app.use(express.static('public'))
app.use(express.json())

// 🧠 Memoria en RAM
let conversationMemory = []

// 🤖 Personalidad fija
const SYSTEM_PROMPT = `
Eres JARVIS, un asistente personal avanzado.
Hablas en español.
Eres conciso, educado y profesional.
Solo das explicaciones largas si el usuario lo pide.
Te comportas como un mayordomo digital inteligente.
`

// Cliente OpenRouter / OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  timeout: 20_000
})

// ✅ Ruta raíz opcional
app.get('/', (req, res) => {
  res.send('🤖 JARVIS con memoria y comandos activo')
})

// ✅ Chat normal con memoria
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    if (!message) return res.status(400).json({ error: 'Mensaje vacío' })

    // Guardar mensaje usuario
    conversationMemory.push({ role: 'user', content: message })
    if (conversationMemory.length > 10) conversationMemory = conversationMemory.slice(-10)

    // Llamada a IA
    const completion = await client.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...conversationMemory],
      temperature: 0.4
    })

    const jarvisReply = completion.choices[0].message.content

    // Guardar respuesta JARVIS
    conversationMemory.push({ role: 'assistant', content: jarvisReply })

    res.json({ reply: jarvisReply })

  } catch (error) {
    console.error('❌ ERROR chat 👉', error.message)
    res.status(500).json({ error: error.message })
  }
})

// ✅ Endpoint para comandos n8n (emails u otras tareas)
app.post('/command', async (req, res) => {
  const { message } = req.body
  if (!message) return res.status(400).json({ error: 'Mensaje vacío' })

  try {
    const response = await fetch('http://localhost:5678/webhook-test/webhook-jarvis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })

    const data = await response.json()
    res.json({ reply: data.reply || 'No hubo respuesta del workflow' })
  } catch (error) {
    console.error('❌ ERROR n8n 👉', error.message)
    res.status(500).json({ error: error.message })
  }
})

// 🔹 Iniciar servidor
app.listen(port, () => {
  console.log(`🤖 JARVIS escuchando en http://localhost:${port}`)
})


