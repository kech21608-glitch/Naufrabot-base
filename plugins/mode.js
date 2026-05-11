const fs = require('fs');
const { join } = require('path');
const { eliteNumbers } = require('../Extractions/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: 'مود',
    description: 'Elite Mode Control | Trauma',
    category: 'tools',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);
            const senderLid = sender.split('@')[0];

            if (!eliteNumbers.includes(senderLid)) {
                return await sock.sendMessage(
                    groupJid,
                    { text: '*ليس لديك صلاحية استخدام هذا الأمر*' },
                    { quoted: msg }
                );
            }

            const args = msg.args || [];
            const modePath = join(process.cwd(), 'data', 'mode.txt');
            const imagePath = join(process.cwd(), 'media', 'mode.jpg');

            let thumbnailBuffer = null;
            if (fs.existsSync(imagePath)) {
                thumbnailBuffer = fs.readFileSync(imagePath);
            }

            let currentMode = '[OFF]';
            if (fs.existsSync(modePath)) {
                currentMode = fs.readFileSync(modePath, 'utf8').trim().toUpperCase();
            }

            if (!args[0]) {
                const displayStatus =
                    currentMode === '[ON]'
                        ? '✅ 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐄𝐥𝐢𝐭𝐞 𝐌𝐨𝐝𝐞: [ON]'
                        : '⛔ 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐄𝐥𝐢𝐭𝐞 𝐌𝐨𝐝𝐞: [OFF]';

                return await sock.sendMessage(
                    groupJid,
                    {
                        text: displayStatus,
                        contextInfo: {
                            externalAdReply: {
                                title: 'Trauma Bot',
                                body: 'Elite mode control panel',
                                mediaType: 2,
                                thumbnail: thumbnailBuffer,
                                sourceUrl: 'https://t.me/YourChannel'
                            }
                        }
                    },
                    { quoted: msg }
                );
            }

            const newMode = args[0].toLowerCase();
            if (!['on', 'off'].includes(newMode)) {
                return await sock.sendMessage(
                    groupJid,
                    { text: '*الصيغة الصحيحة*\n.مود on\n.مود off' },
                    { quoted: msg }
                );
            }

            fs.writeFileSync(modePath, `[${newMode.toUpperCase()}]`);

            const statusDisplay =
                newMode === 'on'
                    ? '✅ 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐄𝐥𝐢𝐭𝐞 𝐌𝐨𝐝𝐞: [ON]'
                    : '⛔ 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐄𝐥𝐢𝐭𝐞 𝐌𝐨𝐝𝐞: [OFF]';

            await sock.sendMessage(
                groupJid,
                {
                    text: statusDisplay,
                    contextInfo: {
                        externalAdReply: {
                            title: '❖══⏣⊰ 𝑇𝑅𝒜𝑈𝑀𝐴 𝐵𝑂𝑇 ⊱⏣══❖',
                            body: '𝐵𝑂𝑇',
                            mediaType: 2,
                            thumbnail: thumbnailBuffer,
                            sourceUrl: 'https://t.me/YourChannel'
                        }
                    }
                },
                { quoted: msg }
            );

        } catch (error) {
            await sock.sendMessage(
                msg.key.remoteJid,
                { text: `*Error*\n${error.message || error.toString()}` },
                { quoted: msg }
            );
        }
    }
};