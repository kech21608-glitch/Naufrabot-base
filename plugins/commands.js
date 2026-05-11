const { cmd, createPluginHandler } = require('./handler')
const config = require('../config')

cmd({
name: 'ping',
exec: async (sock, msg) => {
await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' })
},
description: 'اختبار البوت',
usage: 'ping'
})

cmd({
name: 'bot',
exec: async (sock, msg) => {
await sock.sendMessage(msg.key.remoteJid, { text: 'البوت شغال الآن ✅' })
},
description: 'عرض حالة البوت',
usage: 'bot'
})

cmd({
name: 'say',
exec: async (sock, msg, args) => {
if(!args.length) return sock.sendMessage(msg.key.remoteJid, { text: 'اكتب كلامك' })
await sock.sendMessage(msg.key.remoteJid, { text: args.join(' ') })
},
description: 'البوت يكرر كلامك',
usage: 'say <نص>'
})

cmd({
name: 'song',
exec: async (sock, msg, args) => {
if(!args.length) return sock.sendMessage(msg.key.remoteJid, { text: 'ضع رابط الأغنية' })
await sock.sendMessage(msg.key.remoteJid, { text: `🎵 جاري تشغيل الأغنية: ${args.join(' ')}` })
},
description: 'تشغيل أغنية من رابط',
usage: 'song <رابط>'
})

cmd({
name: 'video',
exec: async (sock, msg, args) => {
if(!args.length) return sock.sendMessage(msg.key.remoteJid, { text: 'ضع رابط الفيديو' })
await sock.sendMessage(msg.key.remoteJid, { text: `🎬 جاري تشغيل الفيديو: ${args.join(' ')}` })
},
description: 'تشغيل فيديو من رابط',
usage: 'video <رابط>'
})

cmd({
name: 'ig',
exec: async (sock, msg, args) => {
if(!args.length) return sock.sendMessage(msg.key.remoteJid, { text: 'ضع رابط الانستقرام' })
await sock.sendMessage(msg.key.remoteJid, { text: `📸 جاري تحميل من انستقرام: ${args.join(' ')}` })
},
description: 'تحميل محتوى من انستقرام',
usage: 'ig <رابط>'
})

cmd({
name: 'menu',
exec: async (sock, msg) => {
const buttons = [
{
title: 'الأوامر العامة',
rows: [
{ title: 'ping', rowId: 'ping', description: 'اختبار البوت' },
{ title: 'say', rowId: 'say', description: 'البوت يكرر كلامك' }
]
},
{
title: 'الميديا',
rows: [
{ title: 'song', rowId: 'song', description: 'تشغيل أغنية' },
{ title: 'video', rowId: 'video', description: 'تشغيل فيديو' },
{ title: 'ig', rowId: 'ig', description: 'تحميل انستقرام' }
]
}
]
await require('./handler').sendButtons(sock, msg.key.remoteJid, '🎛️ قائمة الأوامر', buttons)
},
description: 'عرض قائمة الأوامر',
usage: 'menu'
})