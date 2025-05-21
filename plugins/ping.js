const os = require('os')
const process = require('process')
const { cmd } = require('../command')
const { performance } = require('perf_hooks')

const qMessage = {
  key: {
    fromMe: false,
    remoteJid: "status@broadcast",
    participant: "0@s.whatsapp.net",
  },
  message: {
    contactMessage: {
      displayName: "HIRANYA SATHSARA",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:HIRANYA SATHSARA
TEL:+94723241546
END:VCARD`
    }
  }
}

function formatRuntime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs} hours, ${mins} minutes, ${secs} seconds`
}

cmd({
  pattern: 'system',
  react: '🖥️',
  desc: 'Show system info with latency pong',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    // Measure latency start
    const start = performance.now()

    // Send initial latency check message
    const sentMsg = await conn.sendMessage(mek.key.remoteJid, { text: '🏓 Pinging...' }, { quoted: qMessage })

    // Calculate latency
    const latency = (performance.now() - start).toFixed(2)

    // Prepare system info
    const uptime = formatRuntime(Math.floor(process.uptime()))
    const usedMemMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(0)
    const hostname = os.hostname()
    const ownerName = 'HIRANYA SATHSARA'
    const version = require('../package.json').version || '1.0.0'
    const channelLink = 'https://whatsapp.com/channel/0029VbAqseT30LKNCO71mQ3d'

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

*➤ ʟᴀᴛᴇɴᴄʏ:* ${latency} ms Pong!

*─◈ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ ◈─*
`.trim()

    // Delete initial ping message
    await conn.deleteMessage(mek.key.remoteJid, { id: sentMsg.key.id, remoteJid: mek.key.remoteJid })

    // Send system info with latency pong, quoted as qMessage
    await conn.sendMessage(mek.key.remoteJid, { 
      image: { url: 'https://files.catbox.moe/kzemf5.jpg' }, 
      caption: text 
    }, { quoted: qMessage })
  } catch (e) {
    reply('❌ Failed to get system info')
  }
})
