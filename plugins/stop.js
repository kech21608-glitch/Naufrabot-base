const { isElite } = require('../Extractions/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';
const imagePath = path.join(process.cwd(), 'media', 'mode.jpg'); 

module.exports = {
  command: 'ايقاف',
  description: 'إيقاف تشغيل البوت (خاص بالنخبة فقط)',

  async execute(sock, msg) {
    try {
      const chatId = msg.key.remoteJid;
      const sender = decode(msg.key.participant || msg.key.remoteJid);
      const senderLid = sender.split('@')[0];

      if (!isElite(senderLid)) {
        return await sock.sendMessage(chatId, {
          text: 'لا تملك الصلاحية لاستخدام هذا الأمر.'
        }, { quoted: msg });
      }

      let thumbnailBuffer = null;
      if (fs.existsSync(imagePath)) {
        thumbnailBuffer = fs.readFileSync(imagePath);
      }

      const shutdownMessage = `
\`❖════⊰ 𝐓𝐑𝐀𝐔𝐌𝐀 𝐁𝐎𝐓 ⊱════❖\`

جاري إيقاف تشغيل البوت...
يرجى الانتظار للحظة.
سيتم إنهاء العملية تلقائيًا.
`;

      await sock.sendMessage(chatId, {
        text: shutdownMessage,
        contextInfo: {
          externalAdReply: {
            title: 'Trauma Bot',
            body: 'Elite Command Panel',
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: 'https://t.me/YourChannel'
          }
        }
      }, { quoted: msg });

      setTimeout(() => {
        process.exit(0);
      }, 1500);

    } catch (error) {
      console.error('خطأ أثناء إيقاف البوت:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: 'حدث خطأ أثناء تنفيذ الأمر.'
      }, { quoted: msg });
    }
  }
};