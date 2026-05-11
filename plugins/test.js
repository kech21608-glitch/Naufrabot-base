const fs = require('fs');
const path = require('path');

module.exports = {
    command: 'تست',
    description: 'اختبار البوت',
    usage: '.test',
    category: 'tools',

    async execute(sock, msg) {
        try {
            const decoratedText = `\`❖══⏣⊰ 𝑇𝑅𝒜𝑈𝑀𝐴 𝐵𝑂𝑇 ⊱⏣══❖\``;

            // قائمة الصور
            const images = [
                './images/rex1.jpg',
                './images/rex2.jpg',
                './images/rex3.jpg',
                './images/rex4.jpg', 
                './images/rex5.jpg', 
                './images/rex6.jpg', 
                './images/rex7.jpg', 
                './images/rex8.jpg' 
            ];

            // اختيار صورة عشوائية
            const randomImage = images[Math.floor(Math.random() * images.length)];
            const thumbnailBuffer = fs.readFileSync(path.resolve(randomImage));

            await sock.sendMessage(msg.key.remoteJid, {
                text: decoratedText,
                mentions: [msg.sender],
                contextInfo: {
                    externalAdReply: {
                        title: '𝐓𝐑𝐀𝐔𝐌𝐀𝐁𝐎𝐓',
                        body: 'اختبار البوت',
                        mediaType: 1,
                        thumbnail: thumbnailBuffer,
                        sourceUrl: 'https://t.me/YourChannel'
                    }
                }
            }, { quoted: msg });

        } catch (error) {
            console.error('❌', 'Error executing test:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `حدث خطأ: ${error.message || error.toString()}`
            }, { quoted: msg });
        }
    }
};