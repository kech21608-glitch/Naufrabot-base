const fs = require('fs');
const path = require('path');
const { eliteNumbers } = require('../Extractions/elite.js');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

const zarfConfig = {
  reaction: "🐍",
  reaction_status: "on",
  group: {
    status: "on",
    newSubject: "مـزروف 𝐓𝐑𝐀𝐔𝐌𝐀",
    newDescription: "*╗═══════════════════╔*\n*ريكلس هيه نفسها تروما وش الفرق غيرو اسمهم..*\n*╝═══════════════════╚*\n\n*───────────────*\n*𝐒𝐀𝐇𝐈𝐅𝐔𝐓:*\n*────────────────*\n*https://chat.whatsapp.com/L3UgGVxoyv5Cdmnff7ql3M*\n*───────────────*\n*𝐒𝐇𝐀𝐓:*\n*────────────────*\n*https://chat.whatsapp.com/F97icPyjrwA3T8MpkH68RO*\n*───────────────*\n*تبي تعرف كيف انزرفت دز هنا:*\n*─────────────────────────*\n*https://t.me/Trauma_klash*"
  },
  messages: {
    status: "on",
    mention: "𝐓𝐑𝐀𝐔𝐌𝐀",
    final: "*╗════════════════════╔*\n*تبي تعرف كيف انزرفت؟ خش هنا..*\n*╝════════════════════╚*\n*https://chat.whatsapp.com/L3UgGVxoyv5Cdmnff7ql3M*"
  },
  video: {
    status: "on",
    file: "Gojo.mp4"
  }
};

function fakeQuoted(chatId) {
  return {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: chatId,
      id: "RICLX_klash" + Date.now()
    },
    message: {
      videoMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/12345678_gif.mp4",
        mimetype: "video/mp4",
        caption: "Trauma System",
        fileLength: "12345",
        seconds: 3,
        gifPlayback: true,
        jpegThumbnail: null
      }
    }
  };
}

module.exports = {
  command: 'اخضاع',
  description: 'امر خضوع القروب للأعضاء المميزين',
  usage: '.اخضاع',
  category: 'تروما',

  async execute(sock, msg, args) {
    try {
      const groupJid = msg.key.remoteJid;
      const sender = decode(msg.key.participant || groupJid);
      const senderLid = sender.split('@')[0];

      if (!groupJid.endsWith('@g.us'))
        return await sock.sendMessage(groupJid, { text: 'هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });

      if (!eliteNumbers.includes(senderLid))
        return await sock.sendMessage(groupJid, { text: 'لا تملك صلاحية استخدام هذا الأمر.' }, { quoted: msg });

      const groupMetadata = await sock.groupMetadata(groupJid);
      const botNumber = decode(sock.user.id);

      if (groupMetadata.announce === false)
        await sock.groupSettingUpdate(groupJid, 'announcement');

      if (zarfConfig.reaction_status === "on" && zarfConfig.reaction)
        await sock.sendMessage(groupJid, { react: { text: zarfConfig.reaction, key: msg.key } });

      const membersToDemote = groupMetadata.participants
        .filter(p => p.id !== botNumber && !eliteNumbers.includes(decode(p.id).split('@')[0]))
        .map(p => p.id);

      if (membersToDemote.length > 0)
        await sock.groupParticipantsUpdate(groupJid, membersToDemote, 'demote');

      await sleep(1000);

      const eliteToPromote = groupMetadata.participants
        .filter(p => eliteNumbers.includes(decode(p.id).split('@')[0]) && p.id !== botNumber)
        .map(p => p.id);

      if (eliteToPromote.length > 0)
        await sock.groupParticipantsUpdate(groupJid, eliteToPromote, 'promote');

      if (zarfConfig.group?.status === "on") {
        if (zarfConfig.group.newSubject)
          await sock.groupUpdateSubject(groupJid, zarfConfig.group.newSubject);
        if (zarfConfig.group.newDescription)
          await sock.groupUpdateDescription(groupJid, zarfConfig.group.newDescription);
      }

      if (zarfConfig.messages?.status === "on") {
        const allParticipants = groupMetadata.participants.map(p => p.id);

        if (zarfConfig.messages.mention)
          await sock.sendMessage(groupJid, { text: zarfConfig.messages.mention, mentions: allParticipants });

        if (zarfConfig.messages.final)
          await sock.sendMessage(groupJid, { text: zarfConfig.messages.final });
      }

      if (zarfConfig.video?.status === "on" && zarfConfig.video.file) {
        const videoPath = join(process.cwd(), zarfConfig.video.file);
        if (!fs.existsSync(videoPath))
          return await sock.sendMessage(groupJid, { text: "❌ ملف الفيديو غير موجود." }, { quoted: msg });

        const videoBuffer = fs.readFileSync(videoPath);
        await sock.sendMessage(groupJid, {
          video: videoBuffer,
          mimetype: 'video/mp4',
          ptv: true,
          caption: 'Trauma System'
        }, { quoted: fakeQuoted(groupJid) });
      }

    } catch (error) {
      console.error('خطأ في نظام تروما:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `خطأ في نظام تروما:\n\n${error.message || error.toString()}`
      }, { quoted: msg });
    }
  }
};