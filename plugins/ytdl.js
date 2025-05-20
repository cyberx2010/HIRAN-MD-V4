
const { cmd } = require('../command')
const yts = require('yt-search')
const { yta, ytv } = require('@dark-yasiya/scrap')
const store = {}

function isLangSinhalaOrTamil(text) {
  const sinhala = /[\u0D80-\u0DFF]/.test(text)
  const tamil = /[\u0B80-\u0BFF]/.test(text)
  return sinhala || tamil
}

cmd({
  pattern: "song",
  desc: "Download YouTube songs with quality selection.",
  react: "🎵",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, pushname }) => {
  try {
    if (!q) return reply("Please enter a title or URL")

    const session = store[from]
    const num = parseInt(q)

    if (!isNaN(num) && session && session.step === 'select_result' && session.command === 'song') {
      const selected = session.results[num - 1]
      if (!selected) return reply("Invalid selection.")
      store[from] = { step: 'select_quality', command: 'song', video: selected, from }

      const buttons = `*Select audio format:*

1. MP3 (128kbps)
2. MP3 (Document)`
      return reply(buttons)
    }

    if (!isNaN(num) && session && session.step === 'select_quality' && session.command === 'song') {
      const selected = session.video
      const url = selected.url
      const download = await yta(url)
      const fileName = selected.title + ".mp3"

      if (num === 1) {
        await conn.sendMessage(from, { audio: { url: download.dl_url }, mimetype: "audio/mpeg" }, { quoted: mek })
      } else if (num === 2) {
        await conn.sendMessage(from, { document: { url: download.dl_url }, mimetype: "audio/mpeg", fileName }, { quoted: mek })
      } else {
        return reply("Invalid option.")
      }

      delete store[from]
      return
    }

    const search = await yts(q)
    const results = search.videos.slice(0, 5)
    if (results.length === 0) return reply("No results found.")

    let list = "*🎵 Choose a song:*

"
    results.forEach((v, i) => {
      list += `${i + 1}. ${v.title} [${v.timestamp}]
`
    })
    list += `
_Reply with a number (1-${results.length})_`

    store[from] = { command: 'song', step: 'select_result', results }
    return reply(list)
  } catch (e) {
    console.error(e)
    return reply(`_Error occurred. Try again later._`)
  }
})

cmd({
  pattern: "video",
  desc: "Download YouTube videos with quality selection.",
  react: "🎥",
  category: "download",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, pushname }) => {
  try {
    if (!q) return reply("Please enter a title or URL")

    const session = store[from]
    const num = parseInt(q)

    if (!isNaN(num) && session && session.step === 'select_result' && session.command === 'video') {
      const selected = session.results[num - 1]
      if (!selected) return reply("Invalid selection.")
      store[from] = { step: 'select_quality', command: 'video', video: selected, from }

      const buttons = `*Select video quality:*

1. 360p
2. 480p
3. 720p
4. 360p (Document)`
      return reply(buttons)
    }

    if (!isNaN(num) && session && session.step === 'select_quality' && session.command === 'video') {
      const selected = session.video
      const url = selected.url
      const download = await ytv(url)
      const fileName = selected.title + ".mp4"

      if (num === 1 || num === 2 || num === 3) {
        await conn.sendMessage(from, { video: { url: download.dl_url }, mimetype: "video/mp4" }, { quoted: mek })
      } else if (num === 4) {
        await conn.sendMessage(from, { document: { url: download.dl_url }, mimetype: "video/mp4", fileName }, { quoted: mek })
      } else {
        return reply("Invalid option.")
      }

      delete store[from]
      return
    }

    const search = await yts(q)
    const results = search.videos.slice(0, 5)
    if (results.length === 0) return reply("No results found.")

    let list = "*🎥 Choose a video:*

"
    results.forEach((v, i) => {
      list += `${i + 1}. ${v.title} [${v.timestamp}]
`
    })
    list += `
_Reply with a number (1-${results.length})_`

    store[from] = { command: 'video', step: 'select_result', results }
    return reply(list)
  } catch (e) {
    console.error(e)
    return reply(`_Error occurred. Try again later._`)
  }
})
