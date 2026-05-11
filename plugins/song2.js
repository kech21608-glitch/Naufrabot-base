const axios = require('axios');
const sentTracks = new Set();

// 🔹 دالة الرسالة الوهمية (Fake Quoted)
function fakeQuoted(chatId) {
  return {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: chatId,
      id: "RICLX_klash" + Date.now()
    },
    message: {
      videoMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/12345678_gif.mp4",
        mimetype: "video/mp4",
        caption: "RICLX_klash",
        fileLength: "12345",
        seconds: 3,
        gifPlayback: true,
        jpegThumbnail: null
      }
    }
  };
}

module.exports = {
    category: 'media',
    command: 'اغنيه',
    description: 'يحمل أغاني Funk/Phonk من TikTok بدون API رسمي',
    usage: '.صوت [اسم الأغنية أو الفنان]',

    async execute(sock, msg) {
        const groupJid = msg.key.remoteJid;
        const body = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
        const args = body.trim().split(/\s+/).slice(1);
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(groupJid, {
                text: '⚠️ الرجاء تحديد اسم الأغنية أو الفنان. مثال: .صوت PODESENTA'
            }, { quoted: msg });
        }

        await sock.sendMessage(groupJid, {
            react: { text: "🎵", key: msg.key }
        });

        try {
            const { data } = await axios.get(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query)}`);
            const results = data.data;

            if (!results || results.length === 0) {
                return await sock.sendMessage(groupJid, {
                    text: `⚠️ لم يتم العثور على أي أغنية لـ "${query}".`
                }, { quoted: msg });
            }

            const fresh = results.filter(track => !sentTracks.has(track.nowm));
            if (fresh.length === 0) {
                return await sock.sendMessage(groupJid, {
                    text: `⚠️ لا يوجد أغاني جديدة حاليًا عن "${query}".`
                }, { quoted: msg });
            }

            fresh.sort((a, b) => (b.play || 0) - (a.play || 0));
            const track = fresh[0];
            sentTracks.add(track.nowm);

            const caption = `🎵 *أغنية Funk/Phonk تم العثور عليها*\n\n` +
                            `🎶 الاسم: ${track.title || 'غير معروف'}\n` +
                            `🕘 المدة: ${track.duration || 'غير معروفة'} ثانية\n` +
                            `🔗 الرابط: \`${track.url || track.nowm}\`\n`;

            // استخدم دالة fakeQuoted لإرسال الصوت مع الرسالة الوهمية
            await sock.sendMessage(groupJid, {
                audio: { url: track.nowm },
                mimetype: 'audio/mpeg',
                caption
            }, { quoted: fakeQuoted(groupJid) });

        } catch (err) {
            console.error('فشل جلب الصوت من TikTok:', err.message);
            await sock.sendMessage(groupJid, {
                text: '❌ حدث خطأ أثناء جلب الصوت من TikTok.'
            }, { quoted: msg });
        }
    }
};