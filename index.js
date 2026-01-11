import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'

const app = express()
const port = process.env.PORT || 3000

// Middleware para leer JSON
app.use(express.json())

// Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Ruta base
app.get('/', (req, res) => {
  res.send('JARVIS está vivo 🤖')
})

// Endpoint de conversación
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Mensaje vacío' })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres JARVIS, un asistente personal inteligente, conciso y profesional.'
        },
        {
          role: 'user',
          content: message
        }
      ]
    })

    const reply = completion.choices[0].message.content

    res.json({ reply })

  } catch (error) {
  console.error('ERROR OPENAI 👉', error.message)
  if (error.response) {
    console.error(error.response.data)
  }
  res.status(500).json({
    error: error.message
  })
}

})

app.listen(port, () => {
  console.log(`🤖 JARVIS escuchando en http://localhost:${port}`)
})

