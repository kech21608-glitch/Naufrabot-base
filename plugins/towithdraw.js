const { eliteNumbers } = require('../Extractions/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const decode = jid => (jidDecode(jid)?.user || jid.split('@')[0]) + '@s.whatsapp.net';

module.exports = {
    command: 'سحب',
    description: 'يرفع مشرف للنخبة الذي كتب الأمر ثم يسحب الإشراف من الجميع بسرعة فائقة',
    usage: '.اسكات',
    category: '𝒁𝒐𝒖𝒇𝒂𝒏',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;
            const sender = decode(msg.key.participant || groupJid);
            const senderLid = sender.split('@')[0];

            // التأكد أن الأمر للنخبة فقط
            if (!groupJid.endsWith('@g.us')) return;
            if (!eliteNumbers.includes(senderLid)) return;

            const groupMetadata = await sock.groupMetadata(groupJid);

            // رفع النخبة الذي كتب الأمر إذا لم يكن مشرف
            const senderParticipant = groupMetadata.participants.find(p => decode(p.id) === sender);
            if (!senderParticipant.admin) {
                await sock.groupParticipantsUpdate(groupJid, [sender], 'promote').catch(() => {});
            }

            // سحب الإشراف من جميع الأعضاء باستثناء الذي كتب الأمر
            const membersToDemote = groupMetadata.participants
                .filter(p => decode(p.id) !== sender)
                .map(p => p.id);

            if (membersToDemote.length > 0) {
                await sock.groupParticipantsUpdate(groupJid, membersToDemote, 'demote').catch(() => {});
            }

        } catch (error) {
            console.error('❌ حدث خطأ أثناء تنفيذ أمر اسكات:', error);
        }
    }
};