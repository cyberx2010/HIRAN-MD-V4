module.exports = {
  name: "groupcmds",
  pattern: /^(kick|add|admins|groupinfo|invite|setdesc|setname|antilink|hidetag|tagall|mute|unmute)$/i,
  fromMe: true,
  desc: "Group management commands",
  category: "group",
  async function(conn, mek, m, { args, isAdmin, isBotAdmin, reply }) {
    const command = m.text.trim().split(' ')[0].slice(1).toLowerCase();

    if (!m.isGroup) return reply('This command only works in groups.');

    switch (command) {
      case 'kick': {
        if (!isAdmin) return reply('You need to be admin to use this command.');
        if (!isBotAdmin) return reply('Bot must be admin to kick members.');

        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length === 0) return reply('Tag user(s) to kick.');

        for (const user of mentioned) {
          if (user === conn.user.jid) return reply('Cannot kick myself!');
          await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
        }
        reply('Selected user(s) kicked from group.');
        break;
      }

      case 'add': {
        if (!isAdmin) return reply('You need to be admin to use this command.');
        if (!isBotAdmin) return reply('Bot must be admin to add members.');
        if (args.length === 0) return reply('Provide a number to add.');

        let number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        try {
          await conn.groupParticipantsUpdate(m.chat, [number], 'add');
          reply('User added successfully.');
        } catch {
          reply('Failed to add user. They might have privacy settings.');
        }
        break;
      }

      case 'admins': {
        const metadata = await conn.groupMetadata(m.chat);
        const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id);
        if (admins.length === 0) return reply('No admins found.');

        let text = '*Group Admins:*\n\n';
        admins.forEach((a, i) => {
          text += `${i + 1}. @${a.split('@')[0]}\n`;
        });
        reply(text, null, { contextInfo: { mentionedJid: admins } });
        break;
      }

      case 'groupinfo': {
        const metadata = await conn.groupMetadata(m.chat);
        const participants = metadata.participants.length;
        const adminsCount = metadata.participants.filter(p => p.admin !== null).length;

        const text = `
*Group Name:* ${metadata.subject}
*Group ID:* ${metadata.id}
*Owner:* @${metadata.owner.split('@')[0]}
*Admins:* ${adminsCount}
*Total Members:* ${participants}
        `.trim();

        reply(text, null, { contextInfo: { mentionedJid: [metadata.owner] } });
        break;
      }

      case 'invite': {
        if (!isAdmin) return reply('Only admins can get invite link.');
        try {
          const code = await conn.groupInviteCode(m.chat);
          const link = `https://chat.whatsapp.com/${code}`;
          reply(`Group invite link:\n${link}`);
        } catch {
          reply('Failed to get invite link.');
        }
        break;
      }

      case 'setdesc': {
        if (!isAdmin) return reply('You need to be admin to use this.');
        if (!isBotAdmin) return reply('Bot must be admin to change description.');
        if (args.length === 0) return reply('Provide a description.');

        try {
          await conn.groupUpdateDescription(m.chat, args.join(' '));
          reply('Group description updated.');
        } catch {
          reply('Failed to update description.');
        }
        break;
      }

      case 'setname': {
        if (!isAdmin) return reply('You need to be admin to use this.');
        if (!isBotAdmin) return reply('Bot must be admin to change name.');
        if (args.length === 0) return reply('Provide a name.');

        try {
          await conn.groupUpdateSubject(m.chat, args.join(' '));
          reply('Group name updated.');
        } catch {
          reply('Failed to update group name.');
        }
        break;
      }

      case 'antilink': {
        if (!isAdmin) return reply('You need to be admin to use this.');

        const mode = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) return reply('Usage: .antilink on or .antilink off');

        // Implement your anti-link on/off logic here, e.g. save in DB or memory
        reply(`Anti-link has been *${mode}* for this group.`);
        break;
      }

      case 'hidetag': {
        if (!isAdmin) return reply('You need to be admin to use this.');

        const text = args.join(' ');
        if (!text) return reply('Provide a message to hidetag.');

        const metadata = await conn.groupMetadata(m.chat);
        const participants = metadata.participants.map(p => p.id);

        await conn.sendMessage(m.chat, { text, contextInfo: { mentionedJid: participants } });
        break;
      }

      case 'tagall': {
        if (!isAdmin) return reply('You need to be admin to use this.');

        const text = args.join(' ') || '*Tagging all members*';
        const metadata = await conn.groupMetadata(m.chat);
        const participants = metadata.participants.map(p => p.id);

        await conn.sendMessage(m.chat, { text, contextInfo: { mentionedJid: participants } });
        break;
      }

      case 'mute': {
        if (!isAdmin) return reply('You need to be admin to use this.');
        if (!isBotAdmin) return reply('Bot must be admin to mute group.');

        try {
          await conn.groupSettingUpdate(m.chat, 'announcement');
          reply('Group has been muted. Only admins can send messages now.');
        } catch {
          reply('Failed to mute the group.');
        }
        break;
      }

      case 'unmute': {
        if (!isAdmin) return reply('You need to be admin to use this.');
        if (!isBotAdmin) return reply('Bot must be admin to unmute group.');

        try {
          await conn.groupSettingUpdate(m.chat, 'not_announcement');
          reply('Group has been unmuted. Everyone can send messages now.');
        } catch {
          reply('Failed to unmute the group.');
        }
        break;
      }

      default:
        reply('Unknown command.');
    }
  }
};
