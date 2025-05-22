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
const FOOTER = Config.FOOTER || "• ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴜᴡᴀ ᴛᴇᴄʜ";

// **Auto News Function**
async function sendAutoNews(bot) {
  if (!autoNewsEnabled || !autoNewsChatId) return;
  
  let randomSource = newsSources[Math.floor(Math.random() * newsSources.length)];

  try {
    let response = await axios.get(randomSource.url);
    let articles = response.data.articles || [];

    if (articles.length === 0) return;

    let newsText = `📰 *Latest ${randomSource.name} News:*\n\n`;
    articles.slice(0, 5).forEach((news, i) => {
      newsText += `*${i + 1}.* ${news.title}\n🔗 ${news.link}\n\n`;
    });

    newsText += `\n${FOOTER}`;
    await bot.sendMessage(autoNewsChatId, { text: newsText });
  } catch (error) {
    console.log(`❌ Error fetching news from ${randomSource.name}`);
  }
}

// **Scheduler Function (Runs every 30 minutes)**
setInterval(() => sendAutoNews(global.bot), 30 * 60 * 1000); // 🕒 30 minutes interval

// **Enable Auto News**
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

// **Disable Auto News**
cmd({
  pattern: 'news off',
  react: '❌',
  desc: 'Disable auto news updates',
  category: 'news',
}, async (message, match, { m }) => {
  autoNewsEnabled = false;
  await m.reply('❌ *Auto news updates disabled!*');
});

// **Set News Chat ID**
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