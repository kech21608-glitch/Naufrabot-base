const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const imagePath = path.join(process.cwd(), 'media', 'mode.jpg');

module.exports = {
  command: ['تعديل'],
  description: 'تعديل أو إنشاء كود جديد للبوت عبر الرد على أي رسالة',
  category: 'owner',
  usage: '.تعديل <اسم_الأمر> (بالرد على الرسالة التي تحتوي على الكود أو الملف)',

  async execute(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const args = text.trim().split(/\s+/);
    const commandName = args[1];

    if (!commandName) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '⚠️ اكتب اسم الكود الذي تريد تعديله.'
      }, { quoted: msg });
    }

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '⚠️ يجب الرد على رسالة تحتوي على الكود أو النص.'
      }, { quoted: msg });
    }

    const pluginsDir = path.join(process.cwd(), 'plugins');
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);
    const filePath = path.join(pluginsDir, `${commandName}.js`);

    try {
      let buffer, content = '';
      if (quoted.conversation || quoted.extendedTextMessage?.text) {
        content = quoted.conversation || quoted.extendedTextMessage.text;
      } else {
        buffer = await downloadMediaMessage(
          { message: quoted },
          'buffer',
          {},
          { reuploadRequest: sock.updateMediaMessage }
        );
        if (buffer) content = buffer.toString();
      }

      if (!content || content.trim().length < 3) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: '⚠️ لم أتمكن من قراءة محتوى الرسالة. تأكد أنها كود أو نص واضح.'
        }, { quoted: msg });
      }

      fs.writeFileSync(filePath, content, 'utf-8');

      const thumbnailBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ تم تعديل أو إنشاء الكود: *${commandName}.js* بنجاح!\n📂 المسار: plugins/${commandName}.js\n\n👑 الحقوق: TROUMA`,
        contextInfo: {
          externalAdReply: {
            title: 'Trauma Bot',
            body: 'Plugin Manager',
            mediaType: 2,
            thumbnail: thumbnailBuffer,
            sourceUrl: 'https://t.me/YourChannel'
          }
        }
      }, { quoted: msg });

    } catch (err) {
      console.error('⚠️ خطأ في أمر تعديل:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ حدث خطأ أثناء تعديل الملف:\n${err.message}`
      }, { quoted: msg });
    }
  },

  credits: 'TROUMA'
};