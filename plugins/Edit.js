const axios = require('axios');

const sentVideos = new Set();

function fakeQuoted(chatId) {
    return {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: chatId,
            id: "RICLX_Klash" + Date.now()
        },
        message: {
            videoMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/12345678_gif.mp4", // رابط وهمي
                mimetype: "video/mp4",
                caption: "⊹ ᴘᴜᴜɴʏ ɪɢʟᴇsɪᴀs ⊹",
                fileLength: "12345",
                seconds: 3,
                gifPlayback: true,
                jpegThumbnail: null
            }
        }
    };
}

module.exports = {
    category: 'download',
    command: 'dd',
    description: 'يرسل أفضل فيديو Anime Edit من TikTok.',
    usage: '.ايديت [اسم الأنمي]',

    async execute(sock, msg) {
        const groupJid = msg.key.remoteJid;
        const body = msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';
        const args = body.trim().split(/\s+/).slice(1);
        const query = args.join(' ');
        const searchText = query ? `anime edit ${query}` : 'anime edit';

        // 🔹 إنشاء fakeQuoted عام
        const fake = fakeQuoted(groupJid);

        await sock.sendMessage(groupJid, {
            react: { text: "🎬", key: msg.key }
        });

        try {
            const { data } = await axios.get(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(searchText)}`);
            const results = data.data;

            if (!results || results.length === 0) {
                return await sock.sendMessage(groupJid, {
                    text: `⚠️ لم يتم العثور على نتائج.`
                }, { quoted: fake });
            }

            const fresh = results.filter(v => !sentVideos.has(v.nowm));
            if (fresh.length === 0) {
                return await sock.sendMessage(groupJid, {
                    text: `⚠️ لا يوجد فيديو جديد حاليًا.`
                }, { quoted: fake });
            }

            fresh.sort((a, b) => (b.play || 0) - (a.play || 0));
            const vid = fresh[0];
            sentVideos.add(vid.nowm);

            await sock.sendMessage(groupJid, {
                video: { url: vid.nowm },
                caption: `> *❐┃Download complete┃✅ ❯*\n*🎬 Personal edit:* \`${query || 'عشوائي'}\``
            }, { quoted: fake });

        } catch (err) {
            console.error('فشل جلب فيديو التيك توك:', err.message);
            await sock.sendMessage(groupJid, {
                text: '❌ حدث خطأ أثناء جلب فيديو التيك توك.'
            }, { quoted: fake });
        }
    }
};