module.exports = {
    command: 'بوت',
    description: 'يرسل رسالة ترحيب عند كتابة كلمة بوت',
    usage: '.بوت',
    category: '𝒁𝒐𝒖𝒇𝒂𝒏',

    async execute(sock, msg) {
        try {
            const groupJid = msg.key.remoteJid;

            // نص الترحيب
            const welcomeText = `
*اكتب اوامر ياسبك*
            `;

            await sock.sendMessage(groupJid, { 
                text: welcomeText 
            }, { quoted: msg });

        } catch (error) {
            console.error('❌ حدث خطأ أثناء إرسال رسالة الترحيب:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ حدث خطأ أثناء إرسال رسالة الترحيب:\n\n${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};