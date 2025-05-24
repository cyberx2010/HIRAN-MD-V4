const axios = require('axios');
const { cmd, commands } = require('../command');
const { sinhalaSub } = require('mrnima-moviedl');

cmd({
    pattern: 'sinhalasub',
    alias: ['moviesub'],
    react: '📑',
    category: 'movie',
    desc: 'Search movies on sinhalasub and get download links',
    filename: __filename
}, async (client, message, match, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please provide a search query! (e.g., Deadpool)*');

        const sinhalaSubApi = await sinhalaSub();
        const results = await sinhalaSubApi.search(q);
        const searchResults = results.result.slice(0, 10);

        if (!searchResults || searchResults.length === 0) {
            return await reply(`No results found for: ${q}`);
        }

        let responseText = `🔢 *Please reply with the number you want to select*\n\n📽️ *Search Results for* "${q}":\n\n`;
        searchResults.forEach((item, index) => {
            responseText += `*${index + 1}.* ${item.title}\n🔗 Link: ${item.link}\n\n`;
        });

        const sentMessage = await client.sendMessage(from, {
            text: responseText,
            contextInfo: {
                mentionedJid: ['94768698018@s.whatsapp.net'],
                groupMentions: [],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363380266598327@g.us',
                    newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🩵',
                    serverMessageId: 999
                },
                externalAdReply: {
                    title: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃',
                    body: '𝐇𝐈𝐑𝐀𝐍𝐘𝐀 𝐒𝐀𝐓𝐇𝐒𝐀𝐑𝐀',
                    mediaType: 1,
                    sourceUrl: 'https://files.catbox.moe/4fsn8g.jpg',
                    thumbnailUrl: 'https://files.catbox.moe/rbskon.jpg',
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: message });

        const messageId = sentMessage.key.id;

        client.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg.message) return;

            const userReply = msg.message.conversation || msg.message.extendedTextMessage?.text;
            const isReplyToSentMessage = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;

            if (isReplyToSentMessage) {
                const selectedNumber = parseInt(userReply.trim());
                if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= searchResults.length) {
                    const selectedMovie = searchResults[selectedNumber - 1];
                    const movieUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;

                    try {
                        const movieResponse = await axios.get(movieUrl);
                        const movieData = movieResponse.data.result;
                        const downloadLinks = movieData.dl_links || [];

                        if (downloadLinks.length === 0) {
                            return await reply('No PixelDrain links found.');
                        }

                        let downloadText = `🔢 *Please reply with the number you want to select*\n\n🎥 *${movieData.title}*\n\n`;
                        downloadText += '*Available PixelDrain Download Links:*\n';
                        downloadLinks.forEach((link, index) => {
                            downloadText += `*${index + 1}.* ${link.quality}\nQuality: ${link.size}\n🔗 Link: ${link.link}\n\n`;
                        });

                        const downloadMessage = await client.sendMessage(from, {
                            text: downloadText,
                            contextInfo: {
                                mentionedJid: ['94768698018@s.whatsapp.net'],
                                groupMentions: [],
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363380266598327@g.us',
                                    newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🩵',
                                    serverMessageId: 999
                                },
                                externalAdReply: {
                                    title: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🩵',
                                    body: '𝐇𝐈𝐑𝐀𝐍𝐘𝐀 𝐒𝐀𝐓𝐇𝐒𝐀𝐑𝐀',
                                    mediaType: 1,
                                    sourceUrl: 'https://files.catbox.moe/4fsn8g.jpg',
                                    thumbnailUrl: 'https://files.catbox.moe/rbskon.jpg',
                                    renderLargerThumbnail: true,
                                    showAdAttribution: true
                                }
                            }
                        }, { quoted: msg });

                        const downloadMessageId = downloadMessage.key.id;

                        client.ev.on('messages.upsert', async (downloadMsgUpdate) => {
                            const downloadMsg = downloadMsgUpdate.messages[0];
                            if (!downloadMsg.message) return;

                            const downloadReply = downloadMsg.message.conversation || downloadMsg.message.extendedTextMessage?.text;
                            const isReplyToDownloadMessage = downloadMsg.message.extendedTextMessage?.contextInfo?.stanzaId === downloadMessageId;

                            if (isReplyToDownloadMessage) {
                                const selectedDownload = parseInt(downloadReply.trim());
                                if (!isNaN(selectedDownload) && selectedDownload > 0 && selectedDownload <= downloadLinks.length) {
                                    const selectedLink = downloadLinks[selectedDownload - 1];
                                    const fileId = selectedLink.link.split('/').pop();

                                    await client.sendMessage(from, { react: { text: '⬇️', key: downloadMessage.key } });
                                    await client.sendMessage(from, {
                                        text: '*Downloading your movie... 📥*\n*Wait few minutes...*\n\n> *© ᴄʀᴇᴀᴛᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ*',
                                        contextInfo: {
                                            mentionedJid: ['94768698018@s.whatsapp.net'],
                                            groupMentions: [],
                                            forwardingScore: 1,
                                            isForwarded: true,
                                            forwardedNewsletterMessageInfo: {
                                                newsletterJid: '120363380266598327@g.us',
                                                newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🩵',
                                                serverMessageId: 999
                                            },
                                            externalAdReply: {
                                                title: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃',
                                                body: '𝐇𝐈𝐑𝐀𝐍𝐘𝐀 𝐒𝐀𝐓𝐇𝐒𝐀𝐑𝐀',
                                                mediaType: 1,
                                                sourceUrl: 'https://files.catbox.moe/4fsn8g.jpg',
                                                thumbnailUrl: 'https://files.catbox.moe/rbskon.jpg',
                                                renderLargerThumbnail: true,
                                                showAdAttribution: true
                                            }
                                        }
                                    }, { quoted: message });

                                    const downloadUrl = `https://pixeldrain.com/api/file/${fileId}`;

                                    await client.sendMessage(from, { react: { text: '⬆', key: downloadMessage.key } });
                                    await client.sendMessage(from, {
                                        document: { url: downloadUrl },
                                        mimetype: 'video/mp4',
                                        fileName: `${movieData.title} - ${selectedLink.quality}.mp4`,
                                        caption: `${movieData.title}\n${selectedLink.quality}\n*ᴄʀᴇᴀᴛᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ*`,
                                        contextInfo: {
                                            mentionedJid: ['94768698018@s.whatsapp.net'],
                                            groupMentions: [],
                                            forwardingScore: 1,
                                            isForwarded: true,
                                            forwardedNewsletterMessageInfo: {
                                                newsletterJid: '120363380266598327@g.us',
                                                newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🩵',
                                                serverMessageId: 999
                                            },
                                            externalAdReply: {
                                                title: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃',
                                                body: '𝐇𝐈𝐑𝐀𝐍𝐘𝐀 𝐒𝐀𝐓𝐇𝐒𝐀𝐑𝐀',
                                                mediaType: 1,
                                                sourceUrl: 'https://files.catbox.moe/4fsn8g.jpg',
                                                thumbnailUrl: 'https://files.catbox.moe/rbskon.jpg',
                                                renderLargerThumbnail: true,
                                                showAdAttribution: true
                                            }
                                        }
                                    }, { quoted: message });

                                    await client.sendMessage(from, { react: { text: '✅', key: message.key } });
                                } else {
                                    await reply('Invalid selection. Please reply with a valid number.');
                                }
                            }
                        });
                    } catch (error) {
                        console.error('Error fetching movie details:', error);
                        await reply('An error occurred while fetching movie details. Please try again.');
                    }
                } else {
                    await reply('Invalid selection. Please reply with a valid number.');
                }
            }
        });
    } catch (error) {
        console.error('Error during search:', error);
        await reply('*An error occurred while searching!*');
    }
});
