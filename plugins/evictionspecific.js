const fs = require('fs');
const { eliteNumbers } = require('../Extractions/elite.js');
const { join } = require('path');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: 'خلع',
    description: 'يطرد عدد محدد من الأعضاء العشوائيين دفعة واحدة مع استثناء النخبة والمشرفين',
    usage: '.اورا [عدد]',

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
            const participants = groupMetadata.participants;

            const admins = participants
                .filter(p => p.admin)
                .map(p => decode(p.id).split('@')[0]);

            const protectedSet = new Set([...admins, ...eliteNumbers, botNumber.split('@')[0]]);

            const kickable = participants
                .filter(p => !protectedSet.has(decode(p.id).split('@')[0]))
                .map(p => p.id);

            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const parts = body.trim().split(/\s+/);
            const count = parseInt(parts[1]);

            if (isNaN(count) || count <= 0) {
                return await sock.sendMessage(groupJid, { 
                    text: '⚠️ حدد عدد الأعضاء الذين تريد طردهم.\nمثال: `.اورا 5`' 
                }, { quoted: msg });
            }

            if (kickable.length < count)
                return await sock.sendMessage(groupJid, { 
                    text: `❗ لا يوجد عدد كافٍ من الأعضاء العاديين (${kickable.length} فقط).` 
                }, { quoted: msg });

            const shuffled = kickable.sort(() => 0.5 - Math.random());
            const membersToRemove = shuffled.slice(0, count);

            await sock.sendMessage(groupJid, { text: '𝑶𝑹𝑨!' });

            await sock.groupParticipantsUpdate(groupJid, membersToRemove, 'remove');

            await sock.sendMessage(groupJid, { text: '✅ تم طرد الأعضاء المحددين دفعة واحدة.' });

        } catch (err) {
            console.error('❌ خطأ أثناء تنفيذ أمر اورا:', err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء تنفيذ أمر اورا:\n\n${err.message || err.toString()}`
            }, { quoted: msg });
        }
    }
};