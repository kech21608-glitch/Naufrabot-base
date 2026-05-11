const fs = require('fs');
const { eliteNumbers } = require('../Extractions/elite.js');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');

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

const zarfConfig = {
    reaction: "🐊",
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
    command: 'اوت',
    description: 'يزرف القروب ويرسل صوت',
    usage: '.اوت',
    category: 'تروما',

    async execute(sock, msg) {
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

            if (!groupMetadata.announce)
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

            if (zarfConfig.media?.status === "on" && zarfConfig.media.image) {
                const imgPath = join(process.cwd(), zarfConfig.media.image);
                if (fs.existsSync(imgPath)) {
                    const imageBuffer = fs.readFileSync(imgPath);
                    await sock.updateProfilePicture(groupJid, { buffer: imageBuffer });
                }
            }

            if (zarfConfig.messages?.status === "on") {
                if (zarfConfig.messages.mention)
                    await sock.sendMessage(groupJid, { text: zarfConfig.messages.mention });
                await sleep(500);

                if (zarfConfig.messages.final)
                    await sock.sendMessage(groupJid, { text: zarfConfig.messages.final });
                await sleep(500);
            }

            if (zarfConfig.audio?.status === "on" && zarfConfig.audio.file) {
                const audioPath = join(process.cwd(), zarfConfig.audio.file);
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

        } catch (error) {
            console.error(error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: error.message || error.toString()
            }, { quoted: msg });
        }
    }
};