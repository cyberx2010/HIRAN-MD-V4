const os = require('os')
const process = require('process')
const { cmd } = require('../command')
const { performance } = require('perf_hooks')

function formatRuntime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs} hours, ${mins} minutes, ${secs} seconds`
}

cmd({
  pattern: 'sysinfo',
  react: '🖥️',
  desc: 'Show system info',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    const uptime = formatRuntime(Math.floor(process.uptime()))
    const usedMemMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(0)
    const hostname = os.hostname()
    const ownerName = 'HIRANYA SATHSARA'
    const version = require('../package.json').version || '1.0.0'
    const channelLink = 'https://whatsapp.com/channel/0029Vb0Anqe9RZAcEYc2fT2c'

    const text = `
*╭───────────────●●►*
*┃  𝗕𝗢𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢 ↷*
*╰───────────────●●►*

*➤ ᴜᴘᴛɪᴍᴇ:* ${uptime}
*➤ ʀᴀᴍ ᴜsᴀɢᴇ:* ${usedMemMB}MB / ${totalMemMB}MB
*➤ ʜᴏsᴛɴᴀᴍᴇ:* ${hostname}
*➤ ᴏᴡɴᴇʀ:* ${ownerName}
*➤ ᴠᴇʀsɪᴏɴ:* ${version}
*➤ ᴄʜᴀɴɴᴇʟ:* ${channelLink}

*─◈ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ ◈─*
`.trim()

    await conn.sendMessage(mek.key.remoteJid, {
      image: { url: 'https://files.catbox.moe/kzemf5.jpg' },
      caption: text
    }, { quoted: mek })
  } catch (e) {
    reply('❌ Failed to get system info')
  }
})

cmd({
  pattern: 'ping',
  react: '🏓',
  desc: 'Check bot latency',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  const start = performance.now()
  const sentMsg = await conn.sendMessage(mek.key.remoteJid, { text: '🏓 Pinging...' }, { quoted: mek })
  const ping = (performance.now() - start).toFixed(2)

  const text = `
*╭───────────────●●►*
*┃  𝗣𝗜𝗡𝗚 𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘 ↷*
*╰───────────────●●►*

*➤ ʟᴀᴛᴇɴᴄʏ:* ${ping} ms
*➤ sᴛᴀᴛᴜs:* ✅ ᴏɴʟɪɴᴇ & ᴀᴄᴛɪᴠᴇ

*─◈ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ ◈─*
`.trim()

  await conn.sendMessage(mek.key.remoteJid, { text }, { quoted: mek })
  await conn.deleteMessage(mek.key.remoteJid, { id: sentMsg.key.id, remoteJid: mek.key.remoteJid })
})
