const fs = require('fs');
const path = require('path');
const { writeFile, mkdir } = require('fs/promises');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { eliteNumbers } = require('../Extractions/elite.js');

function isElite(sender) {
    return eliteNumbers.includes(sender.split('@')[0]);
}

module.exports = {
    command: 'لصوره',
    async execute(sock, m) {
        const sender = m.key.participant || m.participant || m.key.remoteJid;

        if (!isElite(sender)) {
            return sock.sendMessage(m.key.remoteJid, {
                text: '🚫 هذا الأمر مخصص للأعضاء النخبة فقط!'
            }, { quoted: m });
        }

        try {
            const chatId = m.key.remoteJid;

            const sticker = m.message?.stickerMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;

            if (!sticker) {
                return sock.sendMessage(chatId, {
                    text: '❌ أرسل هذا الأمر مع ملصق فقط!'
                }, { quoted: m });
            }

            const stream = await downloadContentFromMessage(sticker, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const tempDir = '/sdcard/.bot/bot/temp';
            if (!fs.existsSync(tempDir)) {
                await mkdir(tempDir, { recursive: true });
            }

            const filePath = path.join(tempDir, `sticker_${Date.now()}.jpg`);
            await writeFile(filePath, buffer);

            await sock.sendMessage(chatId, {
                image: buffer,
                caption: "🖼️ تم تحويل الملصق إلى صورة."
            }, { quoted: m });

            fs.unlinkSync(filePath);

        } catch (error) {
            console.error("❌ خطأ أثناء تحويل الملصق إلى صورة:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: '❌ حدث خطأ أثناء التحويل، حاول مرة أخرى لاحقًا.'
            }, { quoted: m });
        }
    }
};