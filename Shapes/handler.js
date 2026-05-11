const { loadPlugins } = require('./plugins');
const config = require('../config');
const fs = require('fs-extra');
const path = require('path');
const { isElite } = require('../Extractions/elite');
const { playSound } = require('../main');

const COLORS = {
    d: '\x1b[1;38;5;51m',
    g: '\x1b[1;38;5;220m',
    r: '\x1b[1;38;5;196m',
    e: '\x1b[1;38;5;46m',
    s: '\x1b[1;38;5;27m',
    p: '\x1b[1;38;5;129m',
    rs: '\x1b[0m'
};

const LUXURY = [
    '\x1b[1;38;5;51m', '\x1b[1;38;5;201m', '\x1b[1;38;5;220m',
    '\x1b[1;38;5;46m', '\x1b[1;38;5;196m', '\x1b[1;38;5;27m',
    '\x1b[1;38;5;129m', '\x1b[1;38;5;214m', '\x1b[1;38;5;45m',
    '\x1b[1;38;5;198m'
];

const randomColor = () => LUXURY[Math.floor(Math.random() * LUXURY.length)];
const speedColor = (t) => t < 100 ? COLORS.e : t < 300 ? COLORS.g : t < 800 ? '\x1b[1;38;5;214m' : COLORS.r;

class Status {
    static c = 0;
    static update() { this.c++; }
}

const commands = new Map();
let displayed = false;
let cache = null;
let reloading = false; // لمنع التحميل المتكرر

// دالة لمسح الكاش وتحميل البلجنز من جديد
async function reloadPlugins() {
    if (reloading) return;
    reloading = true;
    
    try {
        // مسح الكاش من الذاكرة
        Object.keys(require.cache).forEach(key => {
            if (key.includes('/plugins/')) {
                delete require.cache[key];
            }
        });
        
        // تحميل البلجنز الجديدة
        cache = await loadPlugins();
        
        // تحديث الأوامر في الماب
        commands.clear();
        for (const [name, plugin] of Object.entries(cache)) {
            if (plugin && typeof plugin === 'object') {
                commands.set(name.toLowerCase(), {
                    n: name,
                    e: plugin.execute || (() => {}),
                    c: plugin.category || 'g',
                    o: plugin.owner || false,
                    g: plugin.group || false
                });
            }
        }
        
        const c = randomColor();
        console.log(`\n${c}╔════════════════════════════════════╗${COLORS.rs}`);
        console.log(`${c}║      🔄  PLUGINS  RELOADED  🔄   ║${COLORS.rs}`);
        console.log(`${c}╠════════════════════════════════════╣${COLORS.rs}`);
        console.log(`${c}║  📦 ${commands.size.toString().padStart(3)} COMMANDS LOADED     ║${COLORS.rs}`);
        console.log(`${c}║  ⚡ UPDATED SUCCESSFULLY         ║${COLORS.rs}`);
        console.log(`${c}╚════════════════════════════════════╝${COLORS.rs}\n`);
        
        playSound('SUCCESS');
    } catch (error) {
        console.error(`\x1b[1;38;5;196m❌ خطأ في تحميل البلجنز: ${error.message}\x1b[0m`);
        playSound('ERROR');
    } finally {
        reloading = false;
    }
}

function cmd(o = {}) {
    if (!o.name || !o.exec) throw new Error('⚠️');
    commands.set(o.name.toLowerCase(), {
        n: o.name,
        e: o.exec,
        c: o.category || 'g',
        o: o.owner || false,
        g: o.group || false
    });
    return o.name.toLowerCase();
}

function createPluginHandler(o = {}) {
    const h = o.execute || (() => {});
    h.elite = o.elite || false;
    h.group = o.group || false;
    return h;
}

async function handleMessages(sock, { messages }) {
    let m;
    try {
        m = messages[0];
        if (!m) return;

        const body = m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption || '';
        if (!body) return;

        const p = config.prefix;
        if (!body.toLowerCase().startsWith(p.toLowerCase())) return;

        const parts = body.slice(p.length).trim().split(/\s+/);
        const cmd = parts[0]?.toLowerCase();
        const args = parts.slice(1);
        if (!cmd) return;

        const cmdName = cmd.replace(p, '');

        const botPath = path.join(__dirname, '../data/bot.txt');
        let botStatus = '[on]';
        try { if (fs.existsSync(botPath)) botStatus = fs.readFileSync(botPath, 'utf8').trim(); } catch (e) {}
        if (botStatus === '[off]' && cmdName !== 'bot') return;

        let sender;
        if (m.key.remoteJid.endsWith('@g.us')) {
            sender = m.key.participant?.split('@')[0] || 'User';
        } else {
            sender = m.key.remoteJid.split('@')[0] || 'User';
        }

        const modePath = path.join(__dirname, '../data/mode.txt');
        let elite = false;
        try { if (fs.existsSync(modePath)) elite = fs.readFileSync(modePath, 'utf8').trim() === '[on]'; } catch (e) {}

        if (elite && !isElite(sender)) {
            const c = randomColor();
            console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
            console.log(`${c}┃      💎  ELITE ONLY  💎        ┃${COLORS.rs}`);
            console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
            console.log(`${c}┃  ⚡ ${cmdName.padEnd(18)}       ┃${COLORS.rs}`);
            console.log(`${c}┃  🔒 DENIED                      ┃${COLORS.rs}`);
            console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
            return;
        }

        // تحميل الكاش إذا كان فارغ
        if (!cache) {
            cache = await loadPlugins();
            // تحديث الأوامر في الماب
            for (const [name, plugin] of Object.entries(cache)) {
                if (plugin && typeof plugin === 'object') {
                    commands.set(name.toLowerCase(), {
                        n: name,
                        e: plugin.execute || (() => {}),
                        c: plugin.category || 'g',
                        o: plugin.owner || false,
                        g: plugin.group || false
                    });
                }
            }
        }
        
        const handler = cache[cmdName];
        
        if (!handler) {
            const c = randomColor();
            console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
            console.log(`${c}┃      ❓  UNKNOWN  ❓            ┃${COLORS.rs}`);
            console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
            console.log(`${c}┃  ⚡ ${cmdName.padEnd(18)}       ┃${COLORS.rs}`);
            console.log(`${c}┃  ⛔ NOT FOUND                   ┃${COLORS.rs}`);
            console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
            return;
        }

        m.args = args;
        m.command = cmd;
        m.prefix = p;

        if (handler.elite && !config.owners.includes(sender)) {
            const c = randomColor();
            console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
            console.log(`${c}┃      👑  OWNER  👑             ┃${COLORS.rs}`);
            console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
            console.log(`${c}┃  ⚡ ${cmdName.padEnd(18)}       ┃${COLORS.rs}`);
            console.log(`${c}┃  🔒 OWNER ONLY                 ┃${COLORS.rs}`);
            console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
            await sock.sendMessage(m.key.remoteJid, { text: config.messages.ownerOnly });
            return;
        }

        if (handler.group && !m.key.remoteJid.endsWith('@g.us')) {
            const c = randomColor();
            console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
            console.log(`${c}┃      👥  GROUP  👥             ┃${COLORS.rs}`);
            console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
            console.log(`${c}┃  ⚡ ${cmdName.padEnd(18)}       ┃${COLORS.rs}`);
            console.log(`${c}┃  🔓 GROUP ONLY                 ┃${COLORS.rs}`);
            console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
            await sock.sendMessage(m.key.remoteJid, { text: config.messages.groupOnly });
            return;
        }

        const start = Date.now();

        try {
            if (typeof handler === 'function') await handler(sock, m);
            else if (typeof handler.execute === 'function') await handler.execute(sock, m);

            const time = Date.now() - start;
            const sc = speedColor(time);
            const bar = '▰'.repeat(Math.min(Math.floor(time / 100), 10)) + '▱'.repeat(10 - Math.min(Math.floor(time / 100), 10));
            const c = randomColor();
            
            console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
            console.log(`${c}┃      💎  EXECUTED  💎          ┃${COLORS.rs}`);
            console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
            console.log(`${c}┃  ⚡ ${cmdName.padEnd(18)}       ┃${COLORS.rs}`);
            console.log(`${c}┃  ✅ SUCCESS                    ┃${COLORS.rs}`);
            console.log(`${c}┃  ⏱️ ${time.toString().padEnd(4)}ms ${bar}   ┃${COLORS.rs}`);
            console.log(`${c}┃  🚀 ${time < 500 ? 'FAST' : time < 1000 ? 'MEDIUM' : 'SLOW'}${' '.repeat(12)}┃${COLORS.rs}`);
            console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);

            Status.update();

        } catch (error) {
            const c = randomColor();
            console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
            console.log(`${c}┃      🔥  ERROR  🔥             ┃${COLORS.rs}`);
            console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
            console.log(`${c}┃  ⚡ ${cmdName.padEnd(18)}       ┃${COLORS.rs}`);
            console.log(`${c}┃  ❌ ${error.message.substring(0, 15).padEnd(18)}┃${COLORS.rs}`);
            console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
            throw error;
        }

    } catch (error) {
        playSound('ERROR');
        if (m?.key?.remoteJid) {
            await sock.sendMessage(m.key.remoteJid, { text: config.messages.error }).catch(() => {});
        }
    }
}

async function handleCommand(sock, msg, command, args) {
    const cmd = commands.get(command.toLowerCase());
    if (!cmd) {
        const c = randomColor();
        console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
        console.log(`${c}┃      ❓  UNKNOWN  ❓            ┃${COLORS.rs}`);
        console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
        console.log(`${c}┃  ⚡ ${command.padEnd(18)}       ┃${COLORS.rs}`);
        console.log(`${c}┃  ⛔ NOT FOUND                   ┃${COLORS.rs}`);
        console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
        return;
    }

    try {
        if (cmd.o && !config.owners.includes(msg.sender)) {
            const c = randomColor();
            console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
            console.log(`${c}┃      👑  OWNER  👑             ┃${COLORS.rs}`);
            console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
            console.log(`${c}┃  ⚡ ${command.padEnd(18)}       ┃${COLORS.rs}`);
            console.log(`${c}┃  🔒 OWNER ONLY                 ┃${COLORS.rs}`);
            console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
            return msg.reply(config.messages.ownerOnly);
        }
        
        const start = Date.now();
        await cmd.e(sock, msg, args);
        const time = Date.now() - start;
        const sc = speedColor(time);
        const bar = '▰'.repeat(Math.min(Math.floor(time / 100), 10)) + '▱'.repeat(10 - Math.min(Math.floor(time / 100), 10));
        const c = randomColor();
        
        console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
        console.log(`${c}┃      💎  EXECUTED  💎          ┃${COLORS.rs}`);
        console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
        console.log(`${c}┃  ⚡ ${command.padEnd(18)}       ┃${COLORS.rs}`);
        console.log(`${c}┃  ⏱️ ${time.toString().padEnd(4)}ms ${bar}   ┃${COLORS.rs}`);
        console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
        
    } catch (error) {
        const c = randomColor();
        console.log(`\n${c}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${COLORS.rs}`);
        console.log(`${c}┃      🔥  ERROR  🔥             ┃${COLORS.rs}`);
        console.log(`${c}┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫${COLORS.rs}`);
        console.log(`${c}┃  ⚡ ${command.padEnd(18)}       ┃${COLORS.rs}`);
        console.log(`${c}┃  ❌ ${error.message.substring(0, 15).padEnd(18)}┃${COLORS.rs}`);
        console.log(`${c}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${COLORS.rs}\n`);
        playSound('ERROR');
        msg.reply(config.messages.error);
    }
}

function handleMessagesLoader() {
    setTimeout(() => {
        if (!displayed && commands.size > 0) {
            const c = randomColor();
            console.log(`\n${c}╔════════════════════════════════════╗${COLORS.rs}`);
            console.log(`${c}║      💎  BOT  READY  💎        ║${COLORS.rs}`);
            console.log(`${c}╠════════════════════════════════════╣${COLORS.rs}`);
            console.log(`${c}║  📦 ${commands.size.toString().padStart(3)} COMMANDS ACTIVE     ║${COLORS.rs}`);
            console.log(`${c}║  ⚡ ONLINE                       ║${COLORS.rs}`);
            console.log(`${c}╚════════════════════════════════════╝${COLORS.rs}\n`);
            displayed = true;
        }
    }, 50);
}

module.exports = {
    handleMessages,
    handleCommand,
    cmd,
    commands,
    createPluginHandler,
    handleMessagesLoader,
    reloadPlugins // تصدير الدالة للإستخدام اليدوي
};
