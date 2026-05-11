const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const pino = require('pino');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const logger = require('./utils/console');

const question = text => new Promise(resolve => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(text, answer => {
        rl.close();
        resolve(answer);
    });
});

// TROUMA Color System
const COLORS = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    gold: '\x1b[38;5;220m',  
    red: '\x1b[38;5;196m',  
    blue: '\x1b[38;5;21m',  
    purple: '\x1b[38;5;93m',  
    cyan: '\x1b[38;5;51m',  
    green: '\x1b[38;5;46m',  
    yellow: '\x1b[38;5;226m',  
    white: '\x1b[38;5;255m',  
    gray: '\x1b[38;5;245m'
};

class ColorEffects {
    static frame = 0;

    static glow(text) {  
        this.frame++;  
        const colors = [COLORS.gold, COLORS.red, COLORS.blue, COLORS.purple, COLORS.cyan];  
        const color = colors[Math.floor(this.frame / 3) % colors.length];  
        return color + text + COLORS.reset;  
    }  

    static pulse(text) {  
        const intensity = (Math.sin(Date.now() / 200) + 1) / 2;  
        if (intensity > 0.7) return COLORS.gold + text + COLORS.reset;  
        if (intensity > 0.4) return COLORS.red + text + COLORS.reset;  
        return COLORS.purple + text + COLORS.reset;  
    }  

    static matrix(text) {  
        const green = Math.sin(Date.now() / 150) * 127 + 128;  
        return `\x1b[38;2;0;${Math.floor(green)};0m${text}${COLORS.reset}`;  
    }  

    static clock() {  
        const now = new Date();  
        const h = now.getHours().toString().padStart(2, '0');  
        const m = now.getMinutes().toString().padStart(2, '0');  
        const s = now.getSeconds().toString().padStart(2, '0');  
        return this.glow(`[${h}:${m}:${s}]`);  
    }
}

async function showHeader() {
    console.clear();

    console.log(COLORS.purple + '='.repeat(80) + COLORS.reset);  
    console.log(COLORS.gold + '╔══════════════════════════════════════════════════════════════════╗' + COLORS.reset);  
    console.log(COLORS.red + '║                                                                      ║' + COLORS.reset);  
    console.log(COLORS.blue + '║    ████████╗██████╗  ██████╗ ██╗   ██╗███╗   ███╗ █████╗         ║' + COLORS.reset);  
    console.log(COLORS.purple + '║    ╚══██╔══╝██╔══██╗██╔═══██╗██║   ██║████╗ ████║██╔══██╗        ║' + COLORS.reset);  
    console.log(COLORS.gold + '║       ██║   ██████╔╝██║   ██║██║   ██║██╔████╔██║███████║        ║' + COLORS.reset);  
    console.log(COLORS.red + '║       ██║   ██╔══██╗██║   ██║██║   ██║██║╚██╔╝██║██╔══██║        ║' + COLORS.reset);  
    console.log(COLORS.blue + '║       ██║   ██║  ██║╚██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║        ║' + COLORS.reset);  
    console.log(COLORS.purple + '║       ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝        ║' + COLORS.reset);  
    console.log(COLORS.gold + '║                                                                      ║' + COLORS.reset);  
    console.log(COLORS.red + '║                    T R O U M A   S Y S T E M                       ║' + COLORS.reset);  
    console.log(COLORS.blue + '║                         V E R S I O N   4 . 0                         ║' + COLORS.reset);  
    console.log(COLORS.purple + '║                                                                      ║' + COLORS.reset);  
    console.log(COLORS.gold + '╚══════════════════════════════════════════════════════════════════╝' + COLORS.reset);  
    console.log(COLORS.purple + '='.repeat(80) + COLORS.reset);  
    
    console.log(ColorEffects.glow('\n' + '*'.repeat(36) + ' SYSTEM INFO ' + '*'.repeat(36)));  
    console.log(ColorEffects.pulse(' Time: ' + ColorEffects.clock()));  
    console.log(ColorEffects.matrix('─'.repeat(80)));
}

async function loading(text, duration = 400) {
    const frames = ['|', '/', '-', '\\'];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {  
        const frame = frames[i % frames.length];  
        const bar = ColorEffects.glow('#'.repeat(i)) + COLORS.gray + '.'.repeat(steps - i) + COLORS.reset;  
        const percent = Math.floor((i / steps) * 100);  
        
        process.stdout.write(`\r${ColorEffects.glow(frame)} ${ColorEffects.pulse(text)} [${bar}] ${ColorEffects.glow(percent + '%')}`);  
        await new Promise(resolve => setTimeout(resolve, duration / steps));  
    }  
    console.log(' ' + COLORS.green + 'OK' + COLORS.reset);
}

function playSound(name) {
    try {
        const controlPath = path.join(__dirname, 'sounds', 'sound.txt');
        const status = fs.existsSync(controlPath) ? fs.readFileSync(controlPath, 'utf-8').trim() : 'off';
        if (status !== '{on}') return;
        const filePath = path.join(__dirname, 'sounds', name);
        if (fs.existsSync(filePath)) {
            exec(`mpv --no-terminal --really-quiet "${filePath}" > /dev/null 2>&1 &`);
        }
    } catch (e) {}
}

function showMsg(type, message) {
    const icons = {
        'info': 'i',
        'success': '+',
        'error': '!',
        'warning': '*',
        'connect': '>'
    };

    const colors = {  
        'info': COLORS.cyan,  
        'success': COLORS.green,  
        'error': COLORS.red,  
        'warning': COLORS.yellow,  
        'connect': COLORS.blue  
    };  
    
    console.log(`\n${ColorEffects.glow('[')}${colors[type] || COLORS.white}${icons[type] || '~'}${ColorEffects.glow(']')}`);  
    console.log(ColorEffects.pulse(message));  
    console.log(ColorEffects.glow('─'.repeat(60)));
}

function showCopyright() {
    console.log(ColorEffects.glow('\n' + '#'.repeat(80)));
    console.log(ColorEffects.pulse('           T R O U M A   S Y S T E M   ©   2 0 2 4 - 2 0 2 6           '));
    console.log(ColorEffects.glow('                 Premium WhatsApp Bot System v4.0                 '));
    console.log(ColorEffects.glow('#'.repeat(80) + '\n'));
}

const questionEnhanced = text => new Promise(resolve => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(ColorEffects.glow(text), answer => {
        rl.close();
        resolve(answer);
    });
});

async function startBot() {
    try {
        await showHeader();
        playSound('start.mp3');

        showMsg('info', 'Starting TROUMA System v4.0');  
        showCopyright();  

        const sessionDir = path.join(__dirname, 'ملف_الاتصال');
        await fs.ensureDir(sessionDir);

        await loading('Loading Core', 500);  
        await loading('Security System', 400);  
        await loading('WhatsApp API', 600);  
        await loading('Command Modules', 450);  

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['MacOs', 'Chrome', '1.0.0'],
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true
        });

        sock.ev.on('groups.upsert', async (groups) => {
            for (const group of groups) {
                try {
                    await sock.groupMetadata(group.id);
                    console.log(COLORS.green + `[+] تم تحميل بيانات مجموعة: ${group.subject}` + COLORS.reset);
                } catch (err) {
                    console.log(COLORS.yellow + `[-] فشل في تحميل بيانات مجموعة: ${group.id}` + COLORS.reset);
                }
            }
        });

        // ✅ نظام الربط الحديث (Pairing Code)
        if (!sock.authState.creds.registered) {
            console.log(ColorEffects.glow('\n' + '-'.repeat(36) + ' PAIRING SYSTEM ' + '-'.repeat(36)));
            
            console.log(COLORS.bold + '\n[ SETUP ] Please enter your phone number to receive the pairing code:');
            console.log(COLORS.gray + '          (Type "#" to cancel)\n');

            let phoneNumber = await questionEnhanced(' Phone Number : ');
            if (phoneNumber.trim() === '#') {
                showMsg('warning', 'Operation cancelled');
                process.exit();
            }

            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            if (!phoneNumber.match(/^\d{10,15}$/)) {
                showMsg('error', 'Invalid phone number');
                process.exit(1);
            }

            try {
                showMsg('info', 'Fetching latest WhatsApp version...');
                await loading('Creating pairing code', 800);
                
                sock.version = version;
                const code = await sock.requestPairingCode(phoneNumber);
                
                console.log('\n' + ColorEffects.glow('█'.repeat(60)));
                showMsg('success', 'PAIRING CODE GENERATED');
                console.log(`${ColorEffects.pulse(' Code:')} ${ColorEffects.glow(code)}`);
                console.log(`${ColorEffects.pulse(' Phone:')} ${ColorEffects.glow(phoneNumber)}`);
                console.log(`${ColorEffects.pulse(' Time:')} ${ColorEffects.clock()}`);
                console.log(ColorEffects.glow('█'.repeat(60)) + '\n');
                
            } catch (error) {
                showMsg('error', 'Failed to get pairing code');
                showMsg('info', 'Using QR method as backup...');
                sock.printQRInTerminal = true;
            }
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'connecting') {
                logger.info('Connecting to WhatsApp...');
            }

            if (connection === 'open') {
                console.log(ColorEffects.glow('\n' + '★'.repeat(20) + ' CONNECTED ' + '★'.repeat(20)));
                logger.success(`CONNECTED! USER ID: ${sock.user.id}`);
                console.log(ColorEffects.glow('★'.repeat(20) + ' CONNECTED ' + '★'.repeat(20)));

                playSound('success.mp3');

                try {
                    const { addEliteNumber } = require('./Extractions/elite');
                    const botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
                    const jid = `${botNumber}@s.whatsapp.net`;

                    const [info] = await sock.onWhatsApp(jid);
                    if (!info?.jid || !info?.lid) {
                        logger.error('تعذر الحصول على معلومات الجلسة من onWhatsApp');
                        return;
                    }

                    const lidNumber = info.lid.replace(/[^0-9]/g, '');

                    await addEliteNumber(botNumber);
                    await addEliteNumber(lidNumber);

                    showMsg('success', `ADDED ${botNumber} AND ${lidNumber} TO ELITE!`);
                } catch (e) {
                    logger.error('فشل في إضافة رقم الجلسة إلى النخبة:', e.message);
                }

                require('./Shapes/handler').handleMessagesLoader();
                
                // ✅ عرض مؤشر جاهزية متحرك
                setInterval(() => {  
                    const cursors = ['>', '>>', '>>>', ' >>', '  >'];  
                    const cursor = cursors[Math.floor(Date.now() / 200) % cursors.length];  
                    process.stdout.write(`\r${ColorEffects.glow(cursor)} ${ColorEffects.pulse('Ready')} | ${ColorEffects.clock()} | ${ColorEffects.glow('.menu')}`);  
                }, 200);
            }

            if (connection === 'close') {
                const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
                logger.warn(`Disconnected: ${lastDisconnect?.error?.message || 'Unknown reason'}`);

                if (isLoggedOut) {
                    playSound('LOGGOUT.mp3');
                    logger.error('You have been logged out.');
                    process.exit(1);
                } else {
                    logger.info('Reconnecting...');
                    setTimeout(startBot, 3000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
        
        
            const startTime = Date.now();
            
            try {
                const { handleMessages } = require('./Shapes/handler');
                const result = await handleMessages(sock, m);
                
                if (result && result.command) {
                    const elapsedTime = Date.now() - startTime;
                    showMsg('info', `Command: ${result.command} | Time: ${elapsedTime}ms`);
                }
            } catch (err) {
                logger.error('Error while handling message:', err);
                playSound('ERROR.mp3');
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        showMsg('error', `Startup error: ${err.message}`);
        playSound('ERROR.mp3');
        setTimeout(startBot, 3000);
    }
}

function listenToConsole(sock) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (line) => {
        console.log('[ CMD ] Unknown command.');
    });
}

startBot();