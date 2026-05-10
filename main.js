const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
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

const cyan = chalk.cyanBright;
const red = chalk.redBright;
const gray = chalk.gray;

function startBot() {
    try {
        console.clear();
        console.log(gray('┌────────────────────────────────────────────────────────┐'));
        console.log(gray('│') + cyan.bold('                𝐓 𝐑 𝐀 𝐔 𝐌 𝐀  𝐔 𝐋 𝐓 𝐑 𝐀                ') + gray('│'));
        console.log(gray('├────────────────────────────────────────────────────────┤'));
        console.log(gray('│') + cyan('  [SYSTEM] : LOADING CORE MODULES...                    ') + gray('│'));
        console.log(gray('│') + cyan('  [STATUS] : ESTABLISHING SECURE CONNECTION...          ') + gray('│'));
        console.log(gray('└────────────────────────────────────────────────────────┘\n'));

        const sessionDir = path.join(__dirname, 'ملف_الاتصال');
        fs.ensureDirSync(sessionDir);

        const { state, saveCreds } = useMultiFileAuthState(sessionDir);
        fetchLatestBaileysVersion().then(async ({ version }) => {

            const sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false,
                browser: ['Linux', 'Chrome', '1.0.0'],
                logger: pino({ level: 'silent' }),
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true
            });

            if (!sock.authState.creds.registered) {
                console.log(cyan('\n[ INPUT ] ENTER PHONE NUMBER FOR PAIRING:'));
                let phoneNumber = await question(gray(' > '));
                if (phoneNumber.trim() === '#') process.exit();

                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                if (!phoneNumber.match(/^\d{10,15}$/)) {
                    console.log(red("\n[ FATAL ] INVALID PHONE NUMBER.\n"));
                    process.exit(1);
                }

                try {
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log(gray('\n─────────────────────────────────────────'));
                    console.log(cyan(` PAIRING CODE : `) + chalk.white.bold(code));
                    console.log(gray('─────────────────────────────────────────\n'));
                } catch (error) {
                    console.log(red("\n[ ERROR ] PAIRING FAILED.\n"));
                }
            }

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'connecting') {
                    console.log(cyan('[ SYSTEM ] ATTEMPTING CONNECTION...'));
                }

                if (connection === 'open') {
                    console.log(cyan.bold('>>> 𝐓𝐑𝐀𝐔𝐌𝐀 𝐔𝐋𝐓𝐑𝐀 ONLINE.'));
                    require('./handlers/handler').handleMessagesLoader();
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log(red(`[ SYSTEM ] DISCONNECTED. RECONNECTING: ${shouldReconnect}`));
                    if (shouldReconnect) {
                        startBot();
                    } else {
                        console.log(red('[ FATAL ] SESSION EXPIRED.'));
                        process.exit(1);
                    }
                }
            });

            sock.ev.on('messages.upsert', async (m) => {
                const { handleMessages } = require('./handlers/handler');
                await handleMessages(sock, m);
            });

            sock.ev.on('creds.update', saveCreds);
        });

    } catch (err) {
        console.log(red('[ ERROR ] STARTUP FAILED:'), err);
        setTimeout(startBot, 5000);
    }
}

startBot();
