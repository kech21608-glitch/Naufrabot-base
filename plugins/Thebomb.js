//======================================================//
//                 لعبة القنبلة للبوت                  //
//         يغلق القروب عند انفجار القنبلة              //
//     ويمنشن كل اللاعبين الباقيين بعد كل انفجار      //
//======================================================//

const bombGames = {};
const registeredBomb = {};

module.exports = {
    command: 'قنبلة',
    description: 'لعبة القنبلة التفاعلية - تغلق القروب عند انفجار القنبلة وتمنشن الباقيين',
    usage: '.قنبلة',
    category: '𝒁𝒐𝒖𝒇𝒂𝒏',

    async execute(sock, msg) {
        try {
            const group = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;

            if (bombGames[group]) {
                return await sock.sendMessage(group, { text: "🔁 يوجد جولة قنبلة قيد التشغيل." }, { quoted: msg });
            }

            bombGames[group] = {
                started: false,
                players: [],
                activePlayers: [],
                currentHolder: null,
                roundTimer: null,
                roundTime: 30 * 1000 // 30 ثانية لكل الجولة
            };

            const instructions = `
✦━━━ *لعبة القنبلة* ━━━✦
💣 الهدف: لا تقع القنبلة عندك!
📝 التعليمات:
1️⃣ اكتب *شارك* للدخول في اللعبة.
2️⃣ بعد كتابة *بدا* ستبدأ الجولة.
3️⃣ القنبلة تنتقل بين المشاركين.
4️⃣ عند انفجار القنبلة، القروب يقفل ولا يمكن الكتابة.
5️⃣ بعد كل انفجار، سيقوم البوت بمنشن كل اللاعبين الباقيين.
6️⃣ آخر شخص يبقى يفوز!

✦ ارسل "شارك" الآن للانضمام.
            `;

            await sock.sendMessage(group, { text: instructions });

            if (!registeredBomb[group]) {
                registeredBomb[group] = true;

                sock.ev.on('messages.upsert', async (m) => {
                    try {
                        const ms = m.messages[0];
                        if (!ms?.message || ms.key.fromMe) return;
                        const thisGroup = ms.key.remoteJid;
                        if (!bombGames[thisGroup]) return;

                        const game = bombGames[thisGroup];
                        const body = (ms.message.conversation) || (ms.message.extendedTextMessage?.text) || "";
                        const user = ms.key.participant || ms.key.remoteJid;
                        const trimmed = body.trim();

                        // تسجيل اللاعبين بكلمة "شارك"
                        if (trimmed === "شارك" && !game.started) {
                            if (!game.players.includes(user)) {
                                game.players.push(user);
                                await sock.sendMessage(thisGroup, {
                                    text: `✅ انضمام: @${user.split("@")[0]}`,
                                    mentions: [user]
                                });
                            } else {
                                await sock.sendMessage(thisGroup, { text: "❌ أنت مسجل مسبقاً." });
                            }
                            return;
                        }

                        // بدء اللعبة بكلمة "بدا"
                        if (trimmed === "بدا" && !game.started && game.players.length > 0) {
                            game.started = true;
                            game.activePlayers = [...game.players];

                            // تجهيز رسالة المشاركين كل واحد بسطر
                            const mentionsText = game.activePlayers
                                .map(p => `@${p.split("@")[0]}`)
                                .join("\n");

                            await sock.sendMessage(thisGroup, {
                                text: `🎉 بدأت اللعبة! المشاركين:\n${mentionsText}`,
                                mentions: game.activePlayers
                            });

                            startNextBomb(sock, thisGroup, game);
                            return;
                        }

                        // تمرير القنبلة
                        if (game.currentHolder && user === game.currentHolder) {
                            const mentions = ms.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                            const validMention = mentions.find(m => game.activePlayers.includes(m) && m !== game.currentHolder);
                            if (validMention) {
                                game.currentHolder = validMention;
                                await sock.sendMessage(thisGroup, {
                                    text: `💣 القنبلة انتقلت إلى: @${validMention.split("@")[0]}!`,
                                    mentions: [validMention]
                                });
                            }
                        }

                    } catch (err) {
                        console.error("Bomb game listener error:", err);
                    }
                });
            }

        } catch (e) {
            console.error(e);
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ خطأ:\n${e.message}` }, { quoted: msg });
        }
    }
};

// ===== دوال اللعبة =====

async function startNextBomb(sock, group, game) {
    if (game.activePlayers.length <= 1) {
        const winner = game.activePlayers[0];
        if (winner) {
            sock.sendMessage(group, {
                text: `🏆 فائز القنبلة: @${winner.split("@")[0]}!`,
                mentions: [winner]
            });
        }
        delete bombGames[group];
        registeredBomb[group] = false;
        return;
    }

    // اختيار لاعب عشوائي ليبدأ القنبلة
    const holder = game.activePlayers[Math.floor(Math.random() * game.activePlayers.length)];
    game.currentHolder = holder;

    await sock.sendMessage(group, {
        text: `💣 القنبلة عند: @${holder.split("@")[0]}! لديك 30 ثانية للجولة.`,
        mentions: [holder]
    });

    // مؤقت الجولة 30 ثانية
    if (game.roundTimer) clearTimeout(game.roundTimer);
    game.roundTimer = setTimeout(async () => {
        if (!game.currentHolder) return;

        const exploded = game.currentHolder;

        // غلق القروب مؤقتًا (الأدمن فقط)
        try {
            await sock.groupSettingUpdate(group, 'announcement'); // الأدمن فقط
        } catch (e) {
            console.log("لا يمكن غلق الشات:", e.message);
        }

        // انفجار القنبلة عند اللاعب
        await sock.sendMessage(group, {
            text: `💥 بوم! القنبلة انفجرت عند: @${exploded.split("@")[0]}`,
            mentions: [exploded]
        });

        // إزالة اللاعب
        game.activePlayers = game.activePlayers.filter(p => p !== exploded);
        game.currentHolder = null;

        // منشن كل اللاعبين الباقيين
        if (game.activePlayers.length > 0) {
            const remainingMentionsText = game.activePlayers
                .map(p => `@${p.split("@")[0]}`)
                .join("\n");
            await sock.sendMessage(group, {
                text: `👥 اللاعبين الباقيين:\n${remainingMentionsText}`,
                mentions: game.activePlayers
            });
        }

        // فتح القروب مرة أخرى
        try {
            await sock.groupSettingUpdate(group, 'not_announcement'); // السماح للجميع بالكتابة
        } catch (e) {
            console.log("لا يمكن فتح الشات:", e.message);
        }

        // الجولة التالية
        startNextBomb(sock, group, game);

    }, game.roundTime);
}