const fs = require('fs')
const path = require('path')
const { getPlugins } = require('../Shapes/plugins.js')

module.exports = {
  command: ['اوامر'],
  description: 'قائمة الأوامر',
  category: 'tools',

  async execute(sock, msg) {
    try {
      const plugins = getPlugins()
      const categories = {}
      const allCommands = []

      Object.values(plugins).forEach(p => {
        if (p.hidden) return
        const cat = p.category || 'غير مصنف'
        if (!categories[cat]) categories[cat] = []

        const cmd = Array.isArray(p.command) ? p.command.join(' *•* ') : p.command
        const desc = p.description || 'بدون وصف'
        const line =
          `*╭──────────────*\n` +
          `*${cmd}*\n` +
          `*${desc}*\n` +
          `*╰──────────────*`

        categories[cat].push(line)
        allCommands.push(line)
      })

      const catNames = Object.keys(categories)

      let menu = ''
      menu += '*╔══════════════════╗*\n'
      menu += '*T R O M A   B O T*\n'
      menu += '*قائمة الأوامر الرسمية*\n'
      menu += '*╚══════════════════╝*\n\n'

      catNames.forEach((c, i) => {
        menu += `*${i + 1} ⌁ ${c}*\n`
      })

      menu += `*${catNames.length + 1} ⌁ الكل*\n\n`
      menu += '*اكتب:* اوامر رقم\n'
      menu += '*مثال:* اوامر 3\n'

      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const arg = body.split(' ')[1]

      if (arg) {
        const index = parseInt(arg) - 1
        let list = ''

        if (index === catNames.length) {
          list += '*╔════ جميع الأوامر ════╗*\n\n'
          allCommands.forEach(c => {
            list += `${c}\n`
          })
          list += '\n*╚══════════════════╝*'
        } else if (categories[catNames[index]]) {
          list += `*╔════ ${catNames[index]} ════╗*\n\n`
          categories[catNames[index]].forEach(c => {
            list += `${c}\n`
          })
          list += '\n*╚══════════════════╝*'
        } else {
          return sock.sendMessage(msg.key.remoteJid, { text: menu }, { quoted: msg })
        }

        const imgPath = path.join(process.cwd(), 'image.jpeg')
        if (fs.existsSync(imgPath)) {
          return sock.sendMessage(
            msg.key.remoteJid,
            { image: fs.readFileSync(imgPath), caption: list },
            { quoted: msg }
          )
        }

        return sock.sendMessage(msg.key.remoteJid, { text: list }, { quoted: msg })
      }

      const imgPath = path.join(process.cwd(), 'image.jpeg')
      if (fs.existsSync(imgPath)) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { image: fs.readFileSync(imgPath), caption: menu },
          { quoted: msg }
        )
      }

      await sock.sendMessage(msg.key.remoteJid, { text: menu }, { quoted: msg })

    } catch {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '*حدث خطأ أثناء إنشاء قائمة الأوامر*' },
        { quoted: msg }
      )
    }
  }
}