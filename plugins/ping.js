const os = require('os')
const process = require('process')
const { performance } = require('perf_hooks')
const { cmd } = require('../command')

const qMessage = {
  key: {
    fromMe: false,
    remoteJid: "status@broadcast",
    participant: "0@s.whatsapp.net",
  },
  message: {
    contactMessage: {
      displayName: "HIRANYA SATHSARA",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:HIRANYA SATHSARA\nTEL:+94723241546\nEND:VCARD`
    }
  }
}

function formatRuntime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs} hours, ${mins} minutes, ${secs} seconds`
}

// SYSTEM COMMAND
cmd({
  pattern: 'system',
  react: '🖥️',
  desc: 'Show bot system info',
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
    const channelLink = 'https://whatsapp.com/channel/0029VbAqseT30LKNCO71mQ3d'

    const text = `*╭───────────────●●►*
*┃  𝗕𝗢𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢 ↷*
*╰───────────────●●►*

*➤ ᴜᴘᴛɪᴍᴇ:* ${uptime}
*➤ ʀᴀᴍ ᴜsᴀɢᴇ:* ${usedMemMB}MB / ${totalMemMB}MB
*➤ ʜᴏsᴛɴᴀᴍᴇ:* ${hostname}
*➤ ᴏᴡɴᴇʀ:* ${ownerName}
*➤ ᴠᴇʀsɪᴏɴ:* ${version}
*➤ ᴄʜᴀɴɴᴇʟ:* ${channelLink}

*─◈ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ ◈─*`

    await conn.sendMessage(mek.key.remoteJid, {
      image: { url: 'https://files.catbox.moe/kzemf5.jpg' },
      caption: text
    }, { quoted: qMessage })
  } catch (e) {
    reply('❌ Failed to get system info')
  }
})

// PING COMMAND
cmd({
  pattern: 'ping',
  react: '🏓',
  desc: 'Check latency',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    const start = performance.now()
    const pingMsg = await conn.sendMessage(mek.key.remoteJid, { text: '🏓' }, { quoted: qMessage })
    const latency = (performance.now() - start).toFixed(2)
    await conn.sendMessage(mek.key.remoteJid, { text: `🏓 Pong ${latency} ms` }, { quoted: pingMsg })
    await conn.deleteMessage(mek.key.remoteJid, { id: pingMsg.key.id, remoteJid: mek.key.remoteJid })
  } catch (e) {
    reply('❌ Failed to get latency')
  }
})
