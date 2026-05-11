const { eliteNumbers, extractPureNumber } = require('../Extractions/elite.js');

module.exports = {
  command: 'منشن',
  description: 'منشن جماعي لجميع أعضاء القروب | Trauma',
  category: '𝑻𝒐𝒐𝒍𝒔',

  async execute(sock, msg, args = []) {
    try {
      const groupJid = msg.key.remoteJid;
      const senderJid = msg.key.participant || msg.participant || msg.key.remoteJid;
      const senderNumber = extractPureNumber(senderJid);

      if (!groupJid.endsWith('@g.us')) {
        return await sock.sendMessage(
          groupJid,
          { text: '*هذا الأمر يعمل داخل القروبات فقط*' },
          { quoted: msg }
        );
      }

      if (!eliteNumbers.includes(senderNumber)) {
        return await sock.sendMessage(
          groupJid,
          { text: '*هذا الأمر مخصص للنخبة فقط*' },
          { quoted: msg }
        );
      }

      const metadata = await sock.groupMetadata(groupJid);
      const participants = metadata.participants;
      const mentions = participants.map(p => p.id);

      const header = `
*━━━━━━━━━━━━━━━━━━*
*المنشن الجماعي*
*━━━━━━━━━━━━━━━━━━*
`;

      const messageText = args.length
        ? `*الرسالة:*\n*${args.join(' ')}*\n`
        : `*الرسالة:*\n*منشن جماعي لجميع الأعضاء*\n`;

      const list = mentions
        .map(id => `*↫* @${id.split('@')[0]}`)
        .join('\n');

      const footer = `
*━━━━━━━━━━━━━━━━━━*
*Trauma Dev*
*━━━━━━━━━━━━━━━━━━*
`;

      await sock.sendMessage(
        groupJid,
        {
          text: `${header}${messageText}\n${list}\n${footer}`,
          mentions
        },
        { quoted: msg }
      );

    } catch (err) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `*خطأ أثناء تنفيذ الأمر*\n${err.message || err.toString()}` },
        { quoted: msg }
      );
    }
  }
};