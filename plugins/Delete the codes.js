const fs = require('fs');
const path = require('path');
const { eliteNumbers } = require('../Extractions/elite.js'); // ✅ استيراد النخبة

module.exports = {
  command: ['احذف'],
  description: '🗑️ حذف ملف بلجن من مجلد البلجنات حسب الاسم.',
  category: 'tools',

  async execute(sock, msg, args = []) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];

    if (!eliteNumbers.includes(senderNumber)) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ هذا الأمر مخصص للنخبة فقط.',
      }, { quoted: msg });
    }

    // استخراج الاسم من الرسالة (بعد كلمة "حذف")
    const fullText =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';
    const parts = fullText.trim().split(/\s+/);

    if (parts.length < 2) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ يرجى كتابة اسم البلجن بعد كلمة "حذف".\nمثال: حذف بلجن-التجربة',
      }, { quoted: msg });
    }

    const rawName = parts.slice(1).join('-').replace(/[^a-zA-Z0-9-_أ-ي]/g, '');
    const pluginFileName = `${rawName}.js`;
    const pluginFilePath = path.resolve(`./plugins/${pluginFileName}`);

    // التحقق من وجود الملف وحذفه
    try {
      if (fs.existsSync(pluginFilePath)) {
        fs.unlinkSync(pluginFilePath);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `✔️ تم حذف البلجن بنجاح: ${pluginFileName}`,
        }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ الملف غير موجود: ${pluginFileName}`,
        }, { quoted: msg });
      }
    } catch (error) {
      console.error('خطأ أثناء حذف البلجن:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ حدث خطأ أثناء محاولة حذف البلجن.',
      }, { quoted: msg });
    }
  }
};