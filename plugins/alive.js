const { performance } = require('perf_hooks');
const os = require('os');
const moment = require('moment-timezone');

global.aliveMenus = global.aliveMenus || new Map();

module.exports = {
  cmd:'alive',
  alias:['uptime'],
  desc: 'Stylish alive message with ping and number reply options',
  category: 'owner',
  react: '✅',

  async handler(m, { conn, command }) {
    const body = (m.text || '').trim();
    const name = m.pushName || 'User';
    const prefix = '.';
    const version = '0.1.0';
    const time = moment().tz('Asia/Colombo').format('HH:mm:ss');
    const date = moment().tz('Asia/Colombo').format('DD/MM/YYYY');
    const uptime = process.uptime();
    const formatUptime = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      return `${h} hours, ${m} minutes, ${s} seconds`;
    };
    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const memTotal = (os.totalmem() / 1024 / 1024).toFixed(0);

    // ── Handle number replies ──
    if (/^[1-2]$/.test(body) && m.quoted && global.aliveMenus.has(m.quoted.id)) {
      if (body === '1') {
        await conn.sendMessage(m.chat, {
          text: '*COMMANDS MENU*\n\n- .alive\n- .ping\n- .menu\n- .help\n\n(More coming soon)'
        }, { quoted: m });
      } else if (body === '2') {
        const start = performance.now();
        const wait = await conn.sendMessage(m.chat, { text: 'Measuring speed...' }, { quoted: m });
        const end = performance.now();
        const ping = (end - start).toFixed(2);
        await conn.sendMessage(m.chat, {
          text: `*HIRAN-MD Speed*\n\nSpeed: \`${ping}ms\``
        }, { quoted: wait });
      }
      return;
    }

    // ── Handle direct command ──
    if (command === 'alive') {
      const aliveText = `
👋  𝐇𝐈, ${name} 𝐈❜𝐀𝐌 𝐀𝐋𝐈𝐕𝐄 𝐍𝐎𝐖 👾

*╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」*
*│*📅 *\`Date\`*: ${date}
*│*⏰ *\`Time\`*: ${time}
*╰──────────●●►*

*╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」*
*│*👤 *\`User\`*: ${name}
*│*✒️ *\`Prefix\`*: ${prefix}
*│*🧬 *\`Version\`*: ${version}
*│*🎈 *\`Platform\`*: ${os.platform()}
*│*📡 *\`Host\`*: heroku
*│*📟 *\`Uptime\`*: ${formatUptime(uptime)}
*│*📂 *\`Memory\`*: ${memUsed}MB / ${memTotal}MB
*╰──────────●●►*

*╭──────────●●►*
*│* *Hello , I am alive now!!*
*╰──────────●●►* 

*🔢 Reply below number*

1 │❯❯◦ COMMANDS MENU  
2 │❯❯◦CyberX-BOT SPEED

*Github Repo:* Coming Soon

*㋛ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙷𝙸𝚁𝙰𝙽*
`.trim();

      const sent = await conn.sendMessage(m.chat, { text: aliveText }, { quoted: m });
      global.aliveMenus.set(sent.key.id, true);
    }

    if (command === 'ping') {
      const t1 = performance.now();
      const wait = await conn.sendMessage(m.chat, { text: 'Pinging...' }, { quoted: m });
      const t2 = performance.now();
      const ping = (t2 - t1).toFixed(2);
      await conn.sendMessage(m.chat, { text: `*PING RESULT*\n\nSpeed: \`${ping}ms\`` }, { quoted: wait });
    }
  }
};