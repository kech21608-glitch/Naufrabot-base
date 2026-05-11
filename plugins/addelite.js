const fs = require('fs');
const path = require('path');
const {
    eliteNumbers,
    isElite,
    addEliteNumber,
    removeEliteNumber,
    extractPureNumber
} = require('../Extractions/elite');

const imagePath = path.join(process.cwd(), 'media', 'mode.jpg'); 

module.exports = {
    command: 'نخبة',
    description: 'إدارة قائمة النخبة - إضافة، إزالة، عرض',
    usage: '.نخبة اضف/ازل/عرض + منشن أو رد أو رقم',
    category: 'zarf',

    async execute(sock, msg) {
        const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
        const senderNumber = extractPureNumber(senderJid);

        if (!isElite(senderNumber)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: 'هذا الأمر للنخبة فقط [TROUMA]'
            }, { quoted: msg });
        }

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        const action = parts[1];

        if (!action || !['اضف', 'ازل', 'عرض'].includes(action)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: 'استخدام: .نخبة اضف/ازل مع رقم أو منشن، .نخبة عرض'
            }, { quoted: msg });
        }

        let thumbnailBuffer = null;
        if (fs.existsSync(imagePath)) {
            thumbnailBuffer = fs.readFileSync(imagePath);
        }

        if (action === 'عرض') {
            const list = eliteNumbers.map((n, i) => `• ${i + 1}. +${n}`).join('\n') || 'لا يوجد أعضاء';
            const message = `
\`❖════⊰ 𝐓𝐑𝐀𝐔𝐌𝐀 𝐁𝐎𝐓 ⊱════❖\`

╭─[ TROUMA ELITE LIST ]─╮
${list}
╰─[ TROUMA ]─╯
`;
            return sock.sendMessage(msg.key.remoteJid, {
                text: message,
                contextInfo: {
                    externalAdReply: {
                        title: 'Trauma Bot',
                        body: 'Elite Panel',
                        mediaType: 2,
                        thumbnail: thumbnailBuffer,
                        sourceUrl: 'https://t.me/YourChannel'
                    }
                }
            }, { quoted: msg });
        }

        let targetNumber;

        if (parts[2] && /^\d{5,}$/.test(parts[2])) {
            targetNumber = extractPureNumber(parts[2]);
        }

        if (!targetNumber) {
            const targetJid =
                msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                msg.message?.extendedTextMessage?.contextInfo?.participant;

            if (!targetJid) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: 'حدد رقم أو منشن الشخص المستهدف [TROUMA]'
                }, { quoted: msg });
            }

            targetNumber = extractPureNumber(targetJid);
        }

        let replyText = '';

        if (action === 'اضف') {
            if (eliteNumbers.includes(targetNumber)) {
                replyText = `الرقم +${targetNumber} موجود بالفعل [TROUMA]`;
            } else {
                addEliteNumber(targetNumber);
                replyText = `تم إضافة الرقم +${targetNumber} إلى النخبة [TROUMA]`;
            }
        } else if (action === 'ازل') {
            if (!eliteNumbers.includes(targetNumber)) {
                replyText = `الرقم +${targetNumber} غير موجود [TROUMA]`;
            } else {
                removeEliteNumber(targetNumber);
                replyText = `تم إزالة الرقم +${targetNumber} من النخبة [TROUMA]`;
            }
        }

        return sock.sendMessage(msg.key.remoteJid, {
            text: `
\`❖════⊰ 𝐓𝐑𝐀𝐔𝐌𝐀 𝐁𝐎𝐓 ⊱════❖\`

${replyText}
`,
            contextInfo: {
                externalAdReply: {
                    title: 'Trauma Bot',
                    body: 'Elite Panel',
                    mediaType: 2,
                    thumbnail: thumbnailBuffer,
                    sourceUrl: 'https://t.me/YourChannel'
                }
            }
        }, { quoted: msg });
    }
};