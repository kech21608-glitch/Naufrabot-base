const fs = require('fs');
const { eliteNumbers } = require('../Extractions/elite.js');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');
const { addKicked } = require('../Extractions/dataUtils.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

function fakeQuoted(chatId) {
    return {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: chatId,
            id: "TRAUMA_audio_" + Date.now()
        },
        message: {
            audioMessage: {
                mimetype: 'audio/mpeg',
                seconds: 5,
                fileLength: 12345
            }
        }
    };
}

const zarfData = {
    reaction: "🐊",
    reaction_status: "on",
    group: {
        status: "on",
        newSubject: "مزروف 𝐓𝐑𝐀𝐔𝐌𝐀",
        newDescription: "*╗═══════════════════╔*\n*ريكلس هيه نفسها تروما وش الفرق غيرو اسمهم..*\n*╝═══════════════════╚*\n\n*───────────────*\n*𝐒𝐀𝐇𝐈𝐅𝐔𝐓:*\n*────────────────*\n*https://chat.whatsapp.com/L3UgGVxoyv5Cdmnff7ql3M*\n*───────────────*\n*𝐒𝐇𝐀𝐓:*\n*────────────────*\n*https://chat.whatsapp.com/F97icPyjrwA3T8MpkH68RO*\n*───────────────*\n*تبي تعرف كيف انزرفت دز هنا:*\n*─────────────────────────*\n*https://t.me/Reckless_klash*"
    },
    messages: {
        status: "on",
        mention: "𝐓𝐑𝐀𝐔𝐌𝐀",
        final: "*╗════════════════════╔*\n*تبي تعرف كيف انزرفت؟ خش هنا..*\n*╝════════════════════╚*\n*https://chat.whatsapp.com/L3UgGVxoyv5Cdmnff7ql3M*"
    },
    media: {
        status: "off",
        image: "image.jpeg"
    },
    audio: {
        status: "on",
        file: "songs/Trauma.mp3"
    }
};

module.exports = {
    command: 'هاكاي',
    description: 'يزرف القروب ويرسل الصوت ويطبق النظام',
    usage: '.هاكاي',
    category: 'zarf',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);
            const senderLid = sender.split('@')[0];

            if (!groupJid.endsWith('@g.us'))
                return await sock.sendMessage(groupJid, { text: '❗ هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });

            if (!eliteNumbers.includes(senderLid))
                return await sock.sendMessage(groupJid, { text: '❗ لا تملك صلاحية استخدام هذا الأمر.' }, { quoted: msg });

            const groupMetadata = await sock.groupMetadata(groupJid);
            const botNumber = decode(sock.user.id);

            // إرسال الرمز التعبيري
            if (zarfData.reaction_status === "on" && zarfData.reaction) {
                await sock.sendMessage(groupJid, { react: { text: zarfData.reaction, key: msg.key } }).catch(() => {});
            }

            // تحديث اسم القروب والوصف
            if (zarfData.group?.status === "on") {
                if (zarfData.group.newSubject)
                    await sock.groupUpdateSubject(groupJid, zarfData.group.newSubject).catch(() => {});
                if (zarfData.group.newDescription)
                    await sock.groupUpdateDescription(groupJid, zarfData.group.newDescription).catch(() => {});
            }

            // إرسال الرسائل والروابط
            if (zarfData.messages?.status === "on") {
                const allParticipants = groupMetadata.participants.map(p => p.id);
                if (zarfData.messages.mention) {
                    await sock.sendMessage(groupJid, {
                        text: zarfData.messages.mention,
                        mentions: allParticipants
                    }).catch(() => {});
                }
                if (zarfData.messages.final) {
                    await sock.sendMessage(groupJid, { text: zarfData.messages.final }).catch(() => {});
                    await sleep(500);
                }
            }

            // إرسال الصورة (إن وجدت)
            if (zarfData.media?.status === "on" && zarfData.media.image) {
                const imgPath = join(process.cwd(), zarfData.media.image);
                if (fs.existsSync(imgPath)) {
                    const imageBuffer = fs.readFileSync(imgPath);
                    await sock.updateProfilePicture(groupJid, { buffer: imageBuffer }).catch(() => {});
                }
            }

            // إرسال الصوتية
            if (zarfData.audio?.status === "on" && zarfData.audio.file) {
                const audioPath = join(process.cwd(), zarfData.audio.file);
                if (fs.existsSync(audioPath)) {
                    const audioBuffer = fs.readFileSync(audioPath);
                    await sock.sendMessage(groupJid, {
                        audio: audioBuffer,
                        mimetype: 'audio/mpeg',
                        fileName: 'Trauma.mp3',
                        ptt: false
                    }, { quoted: fakeQuoted(groupJid) });
                }
            }

            // طرد الأعضاء غير المصرح لهم
            const toKick = groupMetadata.participants
                .filter(p => p.id !== botNumber && !eliteNumbers.includes(decode(p.id).split('@')[0]))
                .map(p => p.id);

            if (toKick.length > 0) {
                await sleep(10);
                try {
                    await sock.groupParticipantsUpdate(groupJid, toKick, 'remove');
                    addKicked(toKick.map(jid => decode(jid).split('@')[0]));
                } catch (kickErr) {
                    console.error('❌ فشل في طرد الأعضاء:', kickErr);
                    await sock.sendMessage(groupJid, { text: '⚠️ فشل في طرد بعض الأعضاء أو جميعهم.' }, { quoted: msg });
                }
            }

        } catch (error) {
            console.error('❌ خطأ في أمر هاكاي:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء تنفيذ الأمر:\n\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};