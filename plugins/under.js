const { eliteNumbers } = require('../Extractions/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: 'تحت',
    description: 'يقفل الشات، يمنشن الهدف بعبارة "شوف تحت"، يطرده، ثم يعيد فتح الشات (للنخبة فقط)',
    usage: '.طرد <@mention> أو رد على رسالة الهدف أو رقم',
    category: '𝒁𝒐𝒖𝒇𝒂𝒏',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            if (!groupJid || !groupJid.endsWith('@g.us')) return;

            const sender = decode(msg.key.participant || groupJid);
            const senderLid = sender.split('@')[0];
            if (!eliteNumbers.includes(senderLid)) return;

            let targetJid = null;
            const message = msg.message || {};
            const ext = message.extendedTextMessage || {};

            // المنشن
            if (ext.contextInfo?.mentionedJid?.length > 0) {
                targetJid = ext.contextInfo.mentionedJid[0];
            }

            // الرد
            if (!targetJid && ext.contextInfo?.participant) {
                targetJid = ext.contextInfo.participant;
            }

            // رقم بعد الأمر
            if (!targetJid) {
                const text = (ext.text || message.conversation || '').trim();
                const parts = text.split(/\s+/);
                if (parts.length >= 2) {
                    const possible = parts[1].replace(/[^0-9]/g, '');
                    if (possible.length >= 8) {
                        targetJid = possible + '@s.whatsapp.net';
                    }
                }
            }

            if (!targetJid) return;

            // 1) قفل الشات
            await sock.groupSettingUpdate(groupJid, 'announcement').catch(() => {});
            await sleep(1000);

            // 2) منشن الهدف برسالة "شوف تحت"
            await sock.sendMessage(groupJid, {
                text: 'شوف تحت',
                mentions: [targetJid]
            }).catch(() => {});
            await sleep(1500);

            // 3) طرده
            await sock.groupParticipantsUpdate(groupJid, [targetJid], 'remove').catch(() => {});
            await sleep(1000);

            // 4) إعادة فتح الشات
            await sock.groupSettingUpdate(groupJid, 'not_announcement').catch(() => {});

        } catch (error) {
            console.error('❌ خطأ في أمر الطرد:', error);
        }
    }
};