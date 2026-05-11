const axios = require('axios');
const fs = require('fs');

module.exports = {
  command: ['اغنية'],
  category: 'media',
  description: 'تحميل أغنية MP3 من تيك توك عبر الاسم',
  status: 'on',
  version: '3.0',

  async execute(sock, msg) {
    const text = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      ''
    ).trim();

    const query = text.replace(/^[.,،]?(اغنيه)\s*/i, '').trim();

    if (!query) {
      return await sock.sendMessage(msg.key.remoteJid, {
        text: `⊱⊹•─๋︩︪╾─•┈⧽ 🚨 ⧼┈•─╼─๋︩︪•⊹⊰\n⚠️ يَجِبُ كِتَابَةُ اِسْمِ الأُغْنِيَةِ لِمُتَابَعَةِ التَّحْمِيلِ\n⊱⊹•─๋︩︪╾─•┈⧽ 🚨 ⧼┈•─╼─๋︩︪•⊹⊰`
      }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "⏳", key: msg.key }
    });

    try {
      const { data } = await axios.get(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query + ' music')}`);
      const results = data.data;

      if (!results || results.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: `⊱⊹•─๋︩︪╾─•┈⧽ ⚠️ ⧼┈•─╼─๋︩︪•⊹⊰\n❌ لَمْ يَتِمُّ الْعُثُورُ عَلَى نَتَائِج، جَرِّبْ اِسْمًا آخَرَ\n⊱⊹•─๋︩︪╾─•┈⧽ ⚠️ ⧼┈•─╼─๋︩︪•⊹⊰`
        }, { quoted: msg });
      }

      const best = results[0];

      // إرسال صورة وشرح
      const caption = `
⊱⊹•─๋︩︪╾─•┈⧽ 🎵 ⧼┈•─╼─๋︩︪•⊹⊰
📌 العنوان: ${best.title}
⏳ المدة: ${best.duration}
👁 المشاهدات: ${best.play}
🔗 الرابط: ${best.nowm}
⊱⊹•─๋︩︪╾─•┈⧽ 🎵 ⧼┈•─╼─๋︩︪•⊹⊰`;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: best.cover },
        caption
      }, { quoted: msg });

      // إرسال الملف الصوتي بدون externalAdReply
      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: best.music || best.nowm },
        mimetype: 'audio/mp4',
        ptt: false
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "✅", key: msg.key }
      });

    } catch (err) {
      console.error('Error fetching TikTok audio:', err.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⊱⊹•─๋︩︪╾─•┈⧽ ❌ ⧼┈•─╼─๋︩︪•⊹⊰\n⚠️ حَدَثَ خَطَأ، حَاوِلْ مَرَّةً أُخْرَى\n⊱⊹•─๋︩︪╾─•┈⧽ ❌ ⧼┈•─╼─๋︩︪•⊹⊰`
      }, { quoted: msg });
    }
  }
};