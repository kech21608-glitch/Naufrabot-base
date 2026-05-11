const fs = require('fs');
const path = require('path');
const { isElite } = require('../Extractions/elite.js');
const { jidDecode } = require('@whiskeysockets/baileys');

const dataDir = path.join(__dirname, '..', 'data');
const monitorFile = path.join(dataDir, 'monitorState.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(monitorFile)) fs.writeFileSync(monitorFile, JSON.stringify({}));

const loadState = () => {
  try { return JSON.parse(fs.readFileSync(monitorFile)); }
  catch { return {}; }
};

const saveState = (data) => fs.writeFileSync(monitorFile, JSON.stringify(data, null, 2));

let handlerAttached = false;

module.exports = {
  command: 'مراقب',
  description: 'تشغيل/إيقاف المراقب: يراقب أي تغيير في الإشرافات ويعيد التوازن في القروب',
  category: 'tools',

  async execute(sock, m) {
    const groupId = m.key.remoteJid;
    const sender = m.key.participant || m.participant;

    if (!groupId.endsWith('@g.us')) 
      return sock.sendMessage(groupId, { text: 'الأمر للمجموعات فقط' }, { quoted: m });

    const args = m.args || [];
    if (!args[0] || !['شغل','طفي'].includes(args[0].toLowerCase())) {
      return sock.sendMessage(groupId, { text: 'صيغة الأمر: .مراقب شغل / .مراقب طفي' }, { quoted: m });
    }

    const state = loadState();
    const action = args[0].toLowerCase();

    if (action === 'طفي') {
      state[groupId] = { active: false, waitingChoice: false };
      saveState(state);
      return sock.sendMessage(groupId, { text: 'تم إيقاف المراقب' }, { quoted: m });
    }

    state[groupId] = { active: true, waitingChoice: false };
    saveState(state);
    await sock.sendMessage(groupId, { text: 'تم تشغيل المراقب' }, { quoted: m });

    if (handlerAttached) return;

    sock.ev.on('group-participants.update', async (update) => {
      const st = loadState();
      if (!st[update.id]?.active) return;
      if (!['promote', 'demote'].includes(update.action)) return;

      try {
        const meta = await sock.groupMetadata(update.id);
        const botId = jidDecode(sock.user.id).user + '@s.whatsapp.net';
        const owner = meta.owner;

        const elites = meta.participants.filter(p => isElite(p.id)).map(p => p.id);
        const nonEliteAdmins = meta.participants
          .filter(p => p.admin && !isElite(p.id) && p.id !== botId)
          .map(p => p.id);

        if (nonEliteAdmins.length)
          await sock.groupParticipantsUpdate(update.id, nonEliteAdmins, 'demote');

        if (elites.length)
          await sock.groupParticipantsUpdate(update.id, elites, 'promote');

        st[update.id].waitingChoice = true;
        saveState(st);

        await sock.sendMessage(update.id, {
          text:
`تم ضبط الإشراف. خيارات النخبة:
1 لتصفية غير النخبة
2 لإلغاء`
        });

      } catch (err) {
        console.error('Monitor error:', err);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg?.message) return;

      const jid = msg.key.remoteJid;
      const senderJid = msg.key.participant || msg.participant;
      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';

      const st = loadState();
      if (!st[jid]?.waitingChoice) return;
      if (!isElite(senderJid)) return;

      if (body.trim() === '1') {
        st[jid].action = 'clean';
        st[jid].waitingChoice = false;
        saveState(st);
        await executeClean(sock, jid);
      }

      if (body.trim() === '2') {
        delete st[jid];
        saveState(st);
        await sock.sendMessage(jid, { text: 'تم إلغاء العملية' });
      }
    });

    handlerAttached = true;
  }
};

async function executeClean(sock, groupId) {
  const meta = await sock.groupMetadata(groupId);
  const botId = jidDecode(sock.user.id).user + '@s.whatsapp.net';
  const owner = meta.owner;

  const toRemove = meta.participants
    .filter(p => !isElite(p.id) && p.id !== botId && p.id !== owner)
    .map(p => p.id);

  if (toRemove.length)
    await sock.groupParticipantsUpdate(groupId, toRemove, 'remove');

  await sock.sendMessage(groupId, { text: 'تمت التصفية' });
}