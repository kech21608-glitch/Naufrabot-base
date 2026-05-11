const axios = require('axios');

module.exports = {
    command: ['ايديت'], // نخليها زي ما هي عشان البوت يتعرف عالأمر
    category: 'media',
    description: 'تحميل فيديو MP4 من تيك توك عبر الاسم',
    status: 'on',
    version: '3.4',

    async execute(sock, msg) {
        const text = (
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            ''
        ).trim();

        // هنا نخلي البوت يشتغل سواء كتبت "ايديت" أو ".ايديت"
        if (!/^[.,،]?(ايديت)(\s|$)/i.test(text)) return;

        const query = text.replace(/^[.,،]?(ايديت)\s*/i, '').trim();

        if (!query) {
            return await sock.sendMessage(msg.key.remoteJid, {
                text: `اكتب اسم ايديت تبيني اتوقع ليك وش نوع الايديت يعني؟`
            }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: "⏳", key: msg.key }
        });

        try {
            const { data } = await axios.get(
                `https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(query + ' edit')}`
            );
            const results = data.data;

            if (!results || results.length === 0) {
                return await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ ما لقيت المقطع`
                }, { quoted: msg });
            }

            const best = results[Math.floor(Math.random() * results.length)];
            const mentionJid = msg.key.participant || msg.key.remoteJid;

            const caption = `⚡️تمت\n⚡️ تم الحصول على ايديت ${query}\n@${mentionJid.split('@')[0]}`;

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: best.nowm },
                mimetype: 'video/mp4',
                caption,
                mentions: [mentionJid]
            }, { quoted: msg });

            await sock.sendMessage(msg.key.remoteJid, {
                react: { text: "✅", key: msg.key }
            });

        } catch (err) {
            console.error('Error fetching TikTok video:', err.message);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ صار خطأ، جرب مره ثانية`
            }, { quoted: msg });
        }
    }
};