const axios = require('axios');

const newsSources = [
  { name: 'Hiru News', url: 'https://deneth-dev-api-links.vercel.app/api/hiru?&api_key=deneth-md' },
  { name: 'Sirasa News', url: 'https://deneth-dev-api-links.vercel.app/api/sirasa?&api_key=deneth-md' },
  { name: 'Derana News', url: 'https://deneth-dev-api-links.vercel.app/api/derana?&api_key=deneth-md' },
  { name: 'ITN News', url: 'https://deneth-dev-api-links.vercel.app/api/itn?&api_key=deneth-md' },
  { name: 'Neth News', url: 'https://deneth-dev-api-links.vercel.app/api/nethnews?&api_key=deneth-md' },
  { name: 'Lankadeepa News', url: 'https://deneth-dev-api-links.vercel.app/api/lankadeepa?&api_key=deneth-md' },
  { name: 'DasathaLanka News', url: 'https://deneth-dev-api-links.vercel.app/api/dasathalanka?&api_key=deneth-md' },
];

let autoNewsEnabled = false;
let autoNewsChatId = null;

// Change footer here to your credits
const FOOTER = "• ᴄʀᴇᴀᴛᴇᴅ ʙʏ ʜɪʀᴀɴ ᴍᴅ | ᴛᴇᴄʜ ᴇɴᴛʜᴜsɪᴀsᴛ •";

async function sendAutoNews(bot) {
  if (!autoNewsEnabled || !autoNewsChatId) return;

  // Validate chat ID format (example for WhatsApp)
  if (!/^\d+@s\.whatsapp\.net$/.test(autoNewsChatId) && !autoNewsChatId.endsWith('@g.us')) {
    console.log('❌ Invalid chat ID format for auto news');
    return;
  }

  let randomSource = newsSources[Math.floor(Math.random() * newsSources.length)];

  try {
    let response = await axios.get(randomSource.url);
    let articles = response.data?.articles || [];

    if (articles.length === 0) return;

    let newsText = `📰 *Latest ${randomSource.name} News:*\n\n`;
    articles.slice(0, 5).forEach((news, i) => {
      newsText += `*${i + 1}.* ${news.title}\n🔗 ${news.link}\n\n`;
    });

    newsText += `\n${FOOTER}`;
    await bot.sendMessage(autoNewsChatId, { text: newsText });
  } catch (error) {
    console.error(`❌ Error fetching news from ${randomSource.name}:`, error.message);
  }
}

setInterval(() => sendAutoNews(global.bot), 30 * 60 * 1000); // 30 minutes interval

// Enable Auto News
cmd({
  pattern: 'news on',
  react: '✅',
  desc: 'Enable auto news updates',
  category: 'news',
}, async (message, match, { m }) => {
  if (!autoNewsChatId) return await m.reply('❌ *Set a chat ID first with .setnews <chat_id>*');

  autoNewsEnabled = true;
  await m.reply('✅ *Auto news updates enabled!*');
});

// Disable Auto News
cmd({
  pattern: 'news off',
  react: '❌',
  desc: 'Disable auto news updates',
  category: 'news',
}, async (message, match, { m }) => {
  autoNewsEnabled = false;
  await m.reply('❌ *Auto news updates disabled!*');
});

// Set News Chat ID
cmd({
  pattern: 'setnews',
  react: '📢',
  desc: 'Set chat ID for auto news updates',
  category: 'news',
}, async (message, match, { m }) => {
  if (!match) return await m.reply('❌ *Usage: .setnews <chat_id>*');

  autoNewsChatId = match.trim();
  await m.reply(`✅ *Auto news will be sent to:* ${autoNewsChatId}`);
});
