const fs = require('fs');
const path = require('path');
const { eliteNumbers } = require('../Extractions/elite.js');

const dataPath = path.join(__dirname, '..', 'data');
const bannedFile = path.join(dataPath, 'bannedUsers.json');

if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true });
if (!fs.existsSync(bannedFile)) fs.writeFileSync(bannedFile, JSON.stringify({}));

const loadBanned = () => {
  try {
    return JSON.parse(fs.readFileSync(bannedFile));
  } catch {
    return {};
  }
};

const saveBanned = (data) => {
  fs.writeFileSync(bannedFile, JSON.stringify(data, null, 2));
};

const activeTimers = {};
const countdownIntervals = {};

module.exports = {
  name: 'أمر المنبوذ',
  command: ['عبدي'],
  category: 'إدارة²',
  description: 'تجعل شخصاً عبداً عند غوجو لمدة مؤقتة. ممنوع من الكتابة.',
  usage: '@المستخدم أو عبدي سامحتك @ أو عبدي @العضو 02,30',

  async execute(sock, msg, args = []) {
    try {
      const jid = msg.key.remoteJid;
      if (!jid.endsWith('@g.us')) {
        return await sock.sendMessage(jid, { text: '❌ هذا الأمر يعمل فقط داخل المجموعات.' }, { quoted: msg });
      }

      const sender = msg.key.participant || msg.key.remoteJid;
      const senderNumber = sender.split('@')[0];
      if (!eliteNumbers.includes(senderNumber)) {
        return await sock.sendMessage(jid, {
          text: '🚫 هذا الأمر مخصص فقط للنخبة يا نكرة.\n👑 اطلب الإذن أولًا قبل أن تحاول استخدام أوامر الملوك.',
        }, { quoted: msg });
      }

      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const parts = fullText.trim().split(/\s+/);
      const subCommand = parts.length > 1 ? parts[1] : null;

      let banned = loadBanned();

      // ✅ فك الحظر
      if (subCommand === 'سامحتك') {
        if (mentions.length === 0) {
          return sock.sendMessage(jid, { text: '❌ منشن الشخص اللي عايز تسامحه يا عم.' }, { quoted: msg });
        }

        const target = mentions[0];
        if (banned[jid] && banned[jid].target === target) {
          clearTimeout(activeTimers[jid]);
          clearInterval(countdownIntervals[jid]);
          delete banned[jid];
          delete activeTimers[jid];
          delete countdownIntervals[jid];
          saveBanned(banned);
          return sock.sendMessage(jid, {
            text: `✅ سامحتك يا عبدي.. امشي عدل المرة الجاية.`,
            mentions: [target]
          }, { quoted: msg });
        } else {
          return sock.sendMessage(jid, {
            text: `❌ مافيش حظر على هذا الشخص حالياً.`,
            mentions: [target]
          }, { quoted: msg });
        }
      }

      // 🚫 تعيين عبد
      if (mentions.length === 0) {
        return sock.sendMessage(jid, { text: '⚠️ يرجي الإشارة للشخص الذي تريد أن تجعله عبدًا.' }, { quoted: msg });
      }

      const target = mentions[0];
      const targetNumber = target.split('@')[0];

      // قراءة الوقت: افتراضي 5 دقائق (300 ثانية)
      let totalSeconds = 300;
      const timeArg = parts.find(p => /^\d{1,2},\d{1,2}$/.test(p));
      if (timeArg) {
        const [mins, secs] = timeArg.split(',').map(Number);
        totalSeconds = (mins * 60) + secs;
      }

      const banDuration = totalSeconds * 1000;
      const startTime = Date.now();

      banned[jid] = { target, startTime, banDuration };
      saveBanned(banned);

      // 📨 أول رسالة (ثابتة)
      await sock.sendMessage(jid, {
        text: `🫦 @${targetNumber} الان انت صرت عبد عند عمك غوجو.\nاذا فكرت أن تكتب أي شي راح يتم طردك.`,
        mentions: [target]
      }, { quoted: msg });

      // 📨 ثاني رسالة (تُعدّل لاحقاً)
      const countdownMsg = await sock.sendMessage(jid, {
        text: `⏳ @${targetNumber} باقي ${Math.floor(totalSeconds / 60)} دقيقة و ${totalSeconds % 60} ثانية.`,
        mentions: [target]
      });

      // تحديث المؤقت كل ثانية
      countdownIntervals[jid] = setInterval(async () => {
        const remaining = totalSeconds - Math.floor((Date.now() - startTime) / 1000);
        if (remaining <= 0) return;
        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;
        try {
          await sock.sendMessage(jid, {
            edit: countdownMsg.key,
            text: `⏳ @${targetNumber} باقي ${min} دقيقة و ${sec} ثانية.`,
            mentions: [target]
          });
        } catch (e) {}
      }, 1000);

      // انتهاء المهلة تلقائياً
      activeTimers[jid] = setTimeout(async () => {
        clearInterval(countdownIntervals[jid]);
        delete banned[jid];
        delete activeTimers[jid];
        delete countdownIntervals[jid];
        saveBanned(banned);
        await sock.sendMessage(jid, {
          text: `🥵 لقد انتهى الوقت يا عبد غوجو، الآن صرت حر، ولكن لا تعيدها عشان ما ترجع عبد عند عمك تاني 🫦`,
          mentions: [target]
        });
      }, banDuration);

      // مراقبة الرسائل
      const listener = async (update) => {
        const message = update.messages?.[0];
        if (!message || message.key.remoteJid !== jid) return;
        const author = message.key.participant;
        if (!author || author !== target) return;

        let banned = loadBanned();
        if (!banned[jid] || Date.now() - banned[jid].startTime > banned[jid].banDuration) {
          clearTimeout(activeTimers[jid]);
          clearInterval(countdownIntervals[jid]);
          delete banned[jid];
          delete activeTimers[jid];
          delete countdownIntervals[jid];
          saveBanned(banned);
          sock.ev.off('messages.upsert', listener);
          return;
        }

        await sock.sendMessage(jid, {
          text: `أوف.. ي العبد خلفت قانون عمك غوجو.\nمع السلامه ي عبد عمك غوجو 🫦`,
          mentions: [target]
        }, { quoted: msg });

        await sock.groupParticipantsUpdate(jid, [target], 'remove');
        await sock.sendMessage(target, {
          text: `خخخخخخخ ي عبد تتكلم و عمك غوجو رفض هيك طيب طردك انتبه المره الجايه لان لو تم أعدتها بتشوف سجل رقم جديد🫦.`
        });

        clearTimeout(activeTimers[jid]);
        clearInterval(countdownIntervals[jid]);
        delete banned[jid];
        delete activeTimers[jid];
        delete countdownIntervals[jid];
        saveBanned(banned);
        sock.ev.off('messages.upsert', listener);
      };

      sock.ev.on('messages.upsert', listener);

    } catch (e) {
      console.error('❌ خطأ في أمر عبدي:', e);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ حصل خطأ أثناء تنفيذ الأمر.'
      }, { quoted: msg });
    }
  }
};