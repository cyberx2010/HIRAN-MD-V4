const { cmd } = require('../command')
const { fetchJson } = require('../lib/functions')

cmd({
  pattern: 'ai',
  react: '✨',
  desc: 'Chat with AI',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {
  if (!q) return reply('Please provide a question or message after the command.')
  try {
    let data = await fetchJson(`https://chatgptforprabath-md.vercel.app/api/gptv1?q=${encodeURIComponent(q)}`)
    if (!data || !data.data) return reply('No response from AI API.')
    return reply(data.data)
  } catch (e) {
    console.error(e)
    return reply('Sorry, an error occurred while contacting the AI service.')
  }
})
