const { isElite, extractPureNumber } = require('../Extractions/elite.js');

module.exports = {
    command: 'قروب',
    description: 'إنشاء قروب جديد وإضافة رقم محدد (حصري للنخبة)',
    usage: '.قروب اسم_القروب رقم',
    category: 'tools',

    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!isElite(sender)) {
            return sock.sendMessage(chatId, { text: '⛔ هذا الأمر للنخبة فقط' }, { quoted: msg });
        }

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/).slice(1); // تجاهل الأمر نفسه

        if (parts.length < 2) {
            return sock.sendMessage(chatId, { text: '❌ الرجاء كتابة اسم القروب ورقم العضو\nمثال: .قروب تجربة 666666666' }, { quoted: msg });
        }

        const groupName = parts.slice(0, parts.length - 1).join(' ');
        const rawNumber = parts[parts.length - 1];
        const number = extractPureNumber(rawNumber) + '@s.whatsapp.net';

        try {
            const res = await sock.groupCreate(groupName, [number]);
            const newGroupId = res.gid;

            await sock.sendMessage(chatId, { 
                text: `✅ تم إنشاء القروب باسم: ${groupName}\nتمت إضافة الرقم: ${rawNumber}\nمعرف القروب: ${newGroupId}` 
            }, { quoted: msg });

        } catch (err) {
            console.error('خطأ عند إنشاء القروب:', err);
            return sock.sendMessage(chatId, { text: `❌ فشل إنشاء القروب: ${err.message}` }, { quoted: msg });
        }
    }
};