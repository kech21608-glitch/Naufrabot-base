const games = {};
const registered = {};

const wordsList = {
    "ا": { جماد: ["أرزة","أريكة","أسطوانة","أداة","أحذية","أزرار","أثاث"], حيوان: ["أسد","أرنب","أفعى","أيل","أوز","أخطبوط"], بلد: ["ألمانيا","أذربيجان","أستراليا","أندونيسيا","أفغانستان"], نبات: ["أقحوان","أرز","أثل","ألوة","أقحوانة"], اسم: ["أحمد","آمنة","أمير","إيمان","أسامة","أنس","أروى"] },
    "ب": { جماد: ["باب","بلكونة","بندقية","برميل","بطارية","بوصلة"], حيوان: ["بقرة","بطة","بطريق","بلبل","ببغاء","برمائيات"], بلد: ["برازيل","بلجيكا","بحرين","بنغلاديش","بوتسوانا"], نبات: ["بقدونس","بلوط","بطيخ","بامية","بخور","باذنجان"], اسم: ["باسم","بشرى","بلال","بثينة","بهاء","بدر"] },
    "ج": { جماد: ["جدار","جسر","جرس","جهاز","جناح","جيب"], حيوان: ["جمل","جرادة","جرذ","جمبري","جربوع"], بلد: ["جزر القمر","جورجيا","جابون","جيبوتي"], نبات: ["جوافة","جزر","جمرة","جلنار","جهنمية"], اسم: ["جمال","جنى","جاد","جوري","جعفر","جهاد"] },
    "ح": { جماد: ["حذاء","حائط","حقيبة","حصيرة","حامل","حاسوب"], حيوان: ["حصان","حمار","حوت","حشرة","حجل"], بلد: ["حُرّة","حائل"], نبات: ["حبق","حلبة","حور","حشيش"], اسم: ["حسن","حسين","حنان","حلا","حياة","حمزة"] },
    "د": { جماد: ["دلو","دفتر","درّاجة","درع","دبوس"], حيوان: ["دب","دجاجة","ديك","دلفين"], بلد: ["دبي","الدنمارك"], نبات: ["دردار","دالية","دراسية"], اسم: ["دعاء","دانية","ديما","دانا","ديب","دلال"] },
    "س": { جماد: ["سلة","سرير","سبورة","ساعة","سبحة"], حيوان: ["سمك","سلحفاة","سنور","سنجاب","سنجاب البحر"], بلد: ["سوريا","السعودية","سلطنة عمان"], نبات: ["سدر","سوسن","سلق","سذاب"], اسم: ["سامي","سارة","سعد","سهى","سلوى"] },
    "ع": { جماد: ["عصا","عجلة","علم","عمود","عنصر"], حيوان: ["عنزة","عقاب","عنكبوت","عصفور"], بلد: ["عمان","العراق","العربية السعودية"], نبات: ["عوسج","عنب","عطر"], اسم: ["علي","عائشة","عمار","عهد","عزة"] },
    "ف": { جماد: ["فانوس","فأس","فردة","فنجان","فراش"], حيوان: ["فأر","فهد","فراشة","فقمة"], بلد: ["فرنسا","فلسطين","فنلندا"], نبات: ["فول","فراولة","فوجير","فربيون"], اسم: ["فاطمة","فهد","فايز","فرح","فراس"] },
    "ك": { جماد: ["كتاب","كرسي","كوب","كيس","كرسي دوار"], حيوان: ["كركي","كلب","قط","كنغر"], بلد: ["كندا","الكويت","كينيا"], نبات: ["كرنب","كركديه","كزبرة","كاميليا"], اسم: ["كمال","كوثر","كنان","كاميليا","كريم"] },
    "م": { جماد: ["مروحة","مصباح","مكتب","ملعقة","مقعد"], حيوان: ["ماعز","نمر","تمساح","ملاكي"], بلد: ["مصر","ماليزيا","موريتانيا"], نبات: ["موز","مريمية","مشمش","مليسة"], اسم: ["محمد","منى","مريم","معاذ","ماهر"] }
};

module.exports = {
    command: 'فئات',
    category: 'العاب',
    description: 'لعبة فئات مع حروف مختارة غنية بالكلمات والأسماء',
    usage: '.فئات',
    category: '𝒁𝒐𝒖𝒇𝒂𝒏',

    async execute(sock, msg) {
        try {
            const group = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;

            if (games[group]) {
                return await sock.sendMessage(group, { text: "🔁 يوجد لعبة جاهزة قيد الإعداد في هذا القروب." }, { quoted: msg });
            }

            games[group] = {
                mode: null,
                players: [],
                started: false,
                points: {},
                timer: null,
                timeLimit: 60 * 1000,
                needed: 4,
                readyToStart: false,
                groupOnly: group,
                letter: null,
                usedWordsGlobal: { جماد: [], حيوان: [], بلد: [], نبات: [], اسم: [] },
                usedWordsPlayer: {},
            };

            const explain = {
                alone: "لعبة فردية لك فقط — تكتب 'شارك' وستبدأ اللعبة مباشرة.",
                group: "لعبة جماعية — أي عدد يقدر يشارك. بعد كتابة 'شارك' واختتام التسجيل، اكتب 'بدا' لبدء الجولة.",
                tour: "بطولة — تحتاج 4 لاعبين على الأقل. بعد وصول 4، اكتب 'بدا' لبدء الجولة."
            };

            const txt = `
✦━━━ *اختر الفئة* ━━━✦

1️⃣ فئة *لحالك*
${explain.alone}

2️⃣ فئة *مع ناس*
${explain.group}

3️⃣ فئة *بطولة*
${explain.tour}

✦ ارسل رقم الفئة (1 أو 2 أو 3) للاختيار ✦
            `;
            await sock.sendMessage(group, { text: txt }, { quoted: msg });

            if (registered[group]) return;
            registered[group] = true;

            sock.ev.on('messages.upsert', async (m) => {
                const ms = m.messages[0];
                if (!ms?.message || ms.key.fromMe) return;

                const thisGroup = ms.key.remoteJid;
                if (!games[thisGroup]) return;

                const game = games[thisGroup];
                const body = (ms.message.conversation) || (ms.message.extendedTextMessage?.text) || "";
                const user = ms.key.participant || ms.key.remoteJid;
                const trimmed = body.trim();

                if (thisGroup !== game.groupOnly) return;

                // اختيار الفئة
                if (!game.mode) {
                    if (trimmed === "1") game.mode = "alone";
                    else if (trimmed === "2") game.mode = "group";
                    else if (trimmed === "3") game.mode = "tour";
                    else return;

                    await sock.sendMessage(thisGroup, {
                        text: `✔ تم اختيار فئة: *${game.mode === "alone" ? "لحالك" : game.mode === "group" ? "مع ناس" : "بطولة"}*\n\n${explain[game.mode]}\n\nاكتب *شارك* للدخول.`,
                    });
                    return;
                }

                // الانضمام
                if (trimmed === "شارك" && !game.started) {
                    if (game.players.includes(user)) {
                        await sock.sendMessage(thisGroup, { text: "❌ أنت مشارك مسبقاً." });
                        return;
                    }

                    game.players.push(user);
                    game.points[user] = 0;
                    game.usedWordsPlayer[user] = { جماد: [], حيوان: [], بلد: [], نبات: [], اسم: [] };

                    await sock.sendMessage(thisGroup, { text: `✅ انضمام: @${user.split("@")[0]}`, mentions: [user] });

                    if (game.mode === "tour") {
                        if (game.players.length < game.needed) {
                            await sock.sendMessage(thisGroup, { text: `🎮 مطلوب ${game.needed} لاعبين للبطولة. الحالي: ${game.players.length}` });
                        } else {
                            game.readyToStart = true;
                            await sock.sendMessage(thisGroup, { text: "🎉 اكتمل عدد لاعبي البطولة! اكتب *بدا* لبدء الجولة." });
                        }
                        return;
                    }

                    if (game.mode === "alone") {
                        game.readyToStart = true;
                        await startGame(sock, thisGroup, game);
                        return;
                    }

                    game.readyToStart = true;
                    return;
                }

                // بدء الجولة
                if ((trimmed === "بدا" || trimmed === "بدء") && !game.started) {
                    if (!game.readyToStart) {
                        await sock.sendMessage(thisGroup, { text: "⏳ لم يتم فتح البدء بعد." });
                        return;
                    }
                    if (game.mode === "tour" && game.players.length < game.needed) {
                        await sock.sendMessage(thisGroup, { text: `❌ لا يمكن البدء — البطولة تحتاج ${game.needed} لاعبين.` });
                        return;
                    }
                    await startGame(sock, thisGroup, game);
                    return;
                }

                // الاجوبة
                if (game.started) {
                    if (!game.players.includes(user)) return;
                    const answer = trimmed;
                    if (!answer) return;
                    const letter = game.letter;
                    if (!letter) return;

                    if (answer.charAt(0) !== letter) return;

                    let found = false;
                    for (const category in wordsList[letter]) {
                        if (wordsList[letter][category].includes(answer)) {
                            if (game.usedWordsGlobal[category].includes(answer)) {
                                await sock.sendMessage(thisGroup, { text: `❌ كلمة مستخدمة سابقاً: ${answer}`, mentions: [user] });
                                return;
                            }
                            game.points[user] = (game.points[user] || 0) + 1;
                            game.usedWordsGlobal[category].push(answer);
                            game.usedWordsPlayer[user][category].push(answer);

                            await sock.sendMessage(thisGroup, {
                                text: `✔ إجابة صحيحة! +1 نقطة لـ @${user.split("@")[0]} (${category}: ${answer})`,
                                mentions: [user]
                            });
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        await sock.sendMessage(thisGroup, { text: `❌ كلمة غير صحيحة: ${answer}`, mentions: [user] });
                    }
                    return;
                }
            });

        } catch (e) {
            console.error(e);
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ خطأ:\n${e.message}` }, { quoted: msg });
        }
    }
};

async function startGame(sock, group, game) {
    game.started = true;
    const letters = Object.keys(wordsList);
    const letter = letters[Math.floor(Math.random() * letters.length)];
    game.letter = letter;

    const mentions = game.players;

    const needs = `
✦━━━ *بــدأت اللـعـبـة* ━━━✦
🔤 الحرف: *${letter}*

المطلوب لكل لاعب:
• جماد
• حيوان
• بلد
• نبات
• اسم

✦ كل إجابة صحيحة تبدأ بـ *${letter}* = +1 نقطة
✦ المدة: 1 دقيقة
✦ لا يمكن تكرار الكلمة لأي لاعب
`;

    await sock.sendMessage(group, { text: needs, mentions });

    setTimeout(async () => {
        const sorted = [...game.players].sort((a, b) => (game.points[b] || 0) - (game.points[a] || 0));
        let results = "🏁 انتهت الجولة! ترتيب المشاركين:\n\n";

        sorted.forEach((p, i) => {
            const crown = i === 0 ? "👑" : "";
            results += `${crown} @${p.split("@")[0]} - ${game.points[p] || 0} نقطة\n`;
        });

        await sock.sendMessage(group, { text: results, mentions: sorted });

        clearTimeout(game.timer);
        delete games[group];
        registered[group] = false;
    }, game.timeLimit);
}