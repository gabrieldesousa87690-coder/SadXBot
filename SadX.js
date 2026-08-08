// ═══════════════════════════════════════════════════════════════
// 🔥 1. TRATAMENTO DE ERROS GLOBAIS
// ═══════════════════════════════════════════════════════════════

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

// ═══════════════════════════════════════════════════════════════
// 📦 2. IMPORTAÇÃO DE DEPENDÊNCIAS
// ═══════════════════════════════════════════════════════════════

const fs = require("fs-extra");
const path = require("path");
const login = require('mahmud-fca');
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require('qs');
const request = require("request").defaults({ jar: true, simple: false });
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════
// 📂 3. LOG (VERSÃO CLEAN)
// ═══════════════════════════════════════════════════════════════

const log = {
    info: (tag, msg) => console.log(`📘 ${tag.padEnd(12)} ${msg}`),
    success: (tag, msg) => console.log(`✅ ${tag.padEnd(12)} ${msg}`),
    warn: (tag, msg) => console.log(`⚠️ ${tag.padEnd(12)} ${msg}`),
    error: (tag, msg) => console.log(`❌ ${tag.padEnd(12)} ${msg}`),
    master: (tag, msg) => console.log(`👑 ${tag.padEnd(12)} ${msg}`),
    cmd: (tag, msg) => console.log(`⚡ ${tag.padEnd(12)} ${msg}`),
    msg: (tag, msg) => console.log(`💬 ${tag.padEnd(12)} ${msg}`),
    db: (tag, msg) => console.log(`🗄️ ${tag.padEnd(12)} ${msg}`),
    net: (tag, msg) => console.log(`🌐 ${tag.padEnd(12)} ${msg}`)
};

// ═══════════════════════════════════════════════════════════════
// 📂 4. CARREGA CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════

const dirConfig = path.normalize(`${__dirname}/config.json`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands.json`);
const dirAccount = path.normalize(`${__dirname}/account.txt`);

function validJSON(pathDir) {
    try {
        if (!fs.existsSync(pathDir))
            throw new Error(`File "${pathDir}" not found`);
        execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
        return true;
    }
    catch (err) {
        let msgError = err.message;
        msgError = msgError.split("\n").slice(1).join("\n");
        const indexPos = msgError.indexOf("    at");
        msgError = msgError.slice(0, indexPos != -1 ? indexPos - 1 : msgError.length);
        throw new Error(msgError);
    }
}

for (const pathDir of [dirConfig, dirConfigCommands]) {
    try {
        validJSON(pathDir);
    }
    catch (err) {
        log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message.split("\n").map(line => `  ${line}`).join("\n")}\nPlease fix it and restart bot`);
        process.exit(0);
    }
}

const config = require(dirConfig);
const configCommands = require(dirConfigCommands);

if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
    config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());

// ═══════════════════════════════════════════════════════════════
// 🌐 5. OBJETO GLOBAL DO BOT
// ═══════════════════════════════════════════════════════════════

global.SadXBot = {
    startTime: Date.now() - process.uptime() * 1000,
    commands: new Map(),
    eventCommands: new Map(),
    commandFilesPath: [],
    eventCommandsFilesPath: [],
    aliases: new Map(),
    onFirstChat: [],
    onChat: [],
    onEvent: [],
    onReply: new Map(),
    onReaction: new Map(),
    onAnyEvent: [],
    config,
    configCommands,
    envCommands: {},
    envEvents: {},
    envGlobal: {},
    reLoginBot: function () { },
    Listening: null,
    oldListening: [],
    callbackListenTime: {},
    storage5Message: [],
    fcaApi: null,
    botID: null,
    prefix: config.prefix || '!',
    adminBot: config.adminBot || [],
    nickNameBot: config.nickNameBot || 'SadX Bot',
    timeZone: config.timeZone || 'Africa/Luanda'
};

// ═══════════════════════════════════════════════════════════════
// 🗄️ 6. BANCO DE DADOS
// ═══════════════════════════════════════════════════════════════

global.db = {
    allThreadData: [],
    allUserData: [],
    allDashBoardData: [],
    allGlobalData: [],
    threadModel: null,
    userModel: null,
    dashboardModel: null,
    globalModel: null,
    threadsData: null,
    usersData: null,
    dashBoardData: null,
    globalData: null,
    receivedTheFirstMessage: {}
};

// ═══════════════════════════════════════════════════════════════
// 🧠 7. CLIENTE
// ═══════════════════════════════════════════════════════════════

global.client = {
    dirConfig,
    dirConfigCommands,
    dirAccount,
    countDown: {},
    cache: {},
    database: {
        creatingThreadData: [],
        creatingUserData: [],
        creatingDashBoardData: [],
        creatingGlobalData: []
    },
    commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;
const { colors } = utils;

global.temp = {
    createThreadData: [],
    createUserData: [],
    createThreadDataError: [],
    filesOfGoogleDrive: {
        arraybuffer: {},
        stream: {},
        fileNames: {}
    },
    contentScripts: {
        cmds: {},
        events: {}
    }
};

// ═══════════════════════════════════════════════════════════════
// 👀 8. MONITORA CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════

const watchAndReloadConfig = (dir, type, prop, logName) => {
    let lastModified = fs.statSync(dir).mtimeMs;
    let isFirstModified = true;

    fs.watch(dir, (eventType) => {
        if (eventType === type) {
            const oldConfig = global.SadXBot[prop];

            setTimeout(() => {
                try {
                    if (isFirstModified) {
                        isFirstModified = false;
                        return;
                    }
                    if (lastModified === fs.statSync(dir).mtimeMs) {
                        return;
                    }
                    global.SadXBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
                    log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
                }
                catch (err) {
                    log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
                    global.SadXBot[prop] = oldConfig;
                }
                finally {
                    lastModified = fs.statSync(dir).mtimeMs;
                }
            }, 200);
        }
    });
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

global.SadXBot.envGlobal = global.SadXBot.configCommands.envGlobal;
global.SadXBot.envCommands = global.SadXBot.configCommands.envCommands;
global.SadXBot.envEvents = global.SadXBot.configCommands.envEvents;

// ═══════════════════════════════════════════════════════════════
// 📦 9. FUNÇÕES: GETFBSTATE E LOGINMBASIC
// ═══════════════════════════════════════════════════════════════

async function getFbstate(tokenFullPermission) {
    const response1 = await axios({
        url: 'https://graph.facebook.com/app',
        method: "GET",
        params: { access_token: tokenFullPermission }
    });
    if (response1.data.error) throw new Error("Token is invalid");

    const response2 = await axios({
        url: 'https://api.facebook.com/method/auth.getSessionforApp',
        method: "GET",
        params: {
            access_token: tokenFullPermission,
            format: "json",
            new_app_id: response1.data.id,
            generate_session_cookies: '1'
        }
    });
    if (response2.data.error_code) throw new Error("Token is invalid");
    else if (response2.data.session_cookies?.length >= 0)
        return response2.data.session_cookies.map(x => {
            x.key = x.name;
            delete x.name;
            return x;
        });
}

async function loginMbasic(email, pass, userAgent) {
    const targetCookie = "https://m.facebook.com/";
    const headers = {
        "user-agent": userAgent || "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36"
    };
    const jar = request.jar();
    jar.setCookie(`locale=en_US`, targetCookie);

    const res1 = await request({ url: 'https://m.facebook.com/login/', method: 'GET', jar });
    let $ = cheerio.load(res1.body);
    const formData = { ...qs.parse($('#login_form').serialize()) };
    delete formData.pass;
    formData.email = email;
    formData.encpass = `#PWD_BROWSER:0:${~~(Date.now() / 1000)}:${pass}`;

    const res2 = await request({
        url: 'https://m.facebook.com/login/device-based/login/async/',
        method: 'POST',
        jar,
        form: formData
    });

    if (res2.body.includes('c_user')) {
        return jar.getCookies(targetCookie);
    }

    if (res2.body.includes('approvals_code')) {
        throw {
            name: '2FA_REQUIRED',
            message: '2FA code required',
            continue: async function (code) {
                const res3 = await request({
                    url: 'https://m.facebook.com/checkpoint/',
                    method: 'POST',
                    jar,
                    form: { approvals_code: code, 'submit[Submit Code]': 'Submit' }
                });
                if (jar.getCookieString(targetCookie).includes('c_user')) {
                    return jar.getCookies(targetCookie);
                }
                throw new Error('Invalid 2FA code');
            }
        };
    }

    throw new Error('Login failed');
}

// ═══════════════════════════════════════════════════════════════
// 🔑 10. OBTER APPSTATE (COM EMAIL/SENHA DO CONFIG)
// ═══════════════════════════════════════════════════════════════

async function getAppState() {
    try {
        const accountData = fs.readFileSync(dirAccount, 'utf8');
        const parsed = JSON.parse(accountData);

        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].key) {
            return parsed;
        }

        if (typeof parsed === 'string' && parsed.startsWith('EAAAA')) {
            log.info("LOGIN", "🔑 Token detectado...");
            return await getFbstate(parsed);
        }

        if (Array.isArray(parsed) && parsed.length === 2) {
            log.info("LOGIN", "📧 Email/senha detectado...");
            const userAgent = config.facebookAccount?.userAgent;
            return await loginMbasic(parsed[0], parsed[1], userAgent);
        }

        return parsed;
    } catch (e) {
        log.error("LOGIN", `Erro: ${e.message}`);

        if (config.facebookAccount?.email && config.facebookAccount?.password) {
            log.info("LOGIN", "📧 Usando email/senha do config.json...");
            const { email, password, userAgent } = config.facebookAccount;
            try {
                return await loginMbasic(email, password, userAgent);
            } catch (err) {
                log.error("LOGIN", `Erro no login com email: ${err.message}`);
                process.exit(1);
            }
        }

        log.info("LOGIN", "💡 account.txt deve conter: appstate (JSON), token (EAAAA...) ou email/senha");
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════════
// 🗄️ 11. LOADDATA
// ═══════════════════════════════════════════════════════════════

async function loadData(api) {
    const usersPath = path.join(__dirname, 'database', 'data', 'usersData.json');
    const threadsPath = path.join(__dirname, 'database', 'data', 'threadsData.json');

    let users = [];
    let threads = [];

    try {
        if (fs.existsSync(usersPath)) users = fs.readJSONSync(usersPath);
        if (fs.existsSync(threadsPath)) threads = fs.readJSONSync(threadsPath);
    } catch (e) {
        log.warn("DATABASE", `Erro: ${e.message}`);
    }

    global.db.allUserData = users;
    global.db.allThreadData = threads;

    global.db.usersData = {
        get: async (userID) => global.db.allUserData.find(u => u.userID == userID) || null,
        set: async (userID, data) => {
            const index = global.db.allUserData.findIndex(u => u.userID == userID);
            if (index === -1) {
                global.db.allUserData.push({ userID, ...data });
            } else {
                global.db.allUserData[index] = { ...global.db.allUserData[index], ...data };
            }
            fs.writeJSONSync(usersPath, global.db.allUserData, { spaces: 2 });
            return global.db.allUserData.find(u => u.userID == userID);
        },
        getAll: async () => global.db.allUserData,
        getAvatarUrl: (userID) => `https://graph.facebook.com/${userID}/picture?width=500&height=500`
    };

    global.db.threadsData = {
        get: async (threadID) => global.db.allThreadData.find(t => t.threadID == threadID) || null,
        set: async (threadID, data) => {
            const index = global.db.allThreadData.findIndex(t => t.threadID == threadID);
            if (index === -1) {
                global.db.allThreadData.push({ threadID, ...data });
            } else {
                global.db.allThreadData[index] = { ...global.db.allThreadData[index], ...data };
            }
            fs.writeJSONSync(threadsPath, global.db.allThreadData, { spaces: 2 });
            return global.db.allThreadData.find(t => t.threadID == threadID);
        },
        getAll: async () => global.db.allThreadData
    };

    log.db("USERS", `${global.db.allUserData.length} usuários`);
    log.db("THREADS", `${global.db.allThreadData.length} grupos`);
}

// ═══════════════════════════════════════════════════════════════
// 📦 12. LOADSCRIPTS
// ═══════════════════════════════════════════════════════════════

async function loadScripts(api) {
    const cmdsPath = path.normalize(process.cwd() + '/scripts/cmds');
    if (!fs.existsSync(cmdsPath)) {
        log.warn("LOAD", "📁 Pasta scripts/cmds não encontrada");
        return;
    }
    const files = fs.readdirSync(cmdsPath).filter(f => f.endsWith('.js') && !f.endsWith('.eg.js'));

    let loaded = 0;
    let errors = 0;

    for (const file of files) {
        try {
            const cmd = require(`${cmdsPath}/${file}`);
            const name = cmd.config.name;
            global.SadXBot.commands.set(name, cmd);
            loaded++;
            log.success("LOAD", `✅ ${file}`);
        } catch (e) {
            errors++;
            log.error("LOAD", `❌ ${file}: ${e.message}`);
        }
    }

    log.success("LOAD", `📦 ${loaded} comandos carregados${errors ? `, ${errors} falhas` : ''}`);
}

// ═══════════════════════════════════════════════════════════════
// 🎯 13. HANDLER DE EVENTOS (VERSÃO CLEAN)
// ═══════════════════════════════════════════════════════════════

function handleEvent(api, event) {
    try {
        // 🔥 PULA EVENTOS DO PRÓPRIO BOT
        if (event.senderID === api.getCurrentUserID()) {
            return;
        }
        
        // 🔥 PEGA O TIPO DO EVENTO
        const eventType = event.type || event.event_type || 'unknown';
        
        // 🔥 SÓ PROCESSA MENSAGENS
        const isMessage = eventType === 'message' || 
                         eventType === 'message_reply' || 
                         eventType === 'group' ||
                         eventType === 'user' ||
                         event.body !== undefined;
        
        if (!isMessage) {
            return;
        }
        
        // 🔥 PEGA OS DADOS
        const body = event.body || event.message || event.text || '';
        const threadID = event.threadID || event.thread_id || event.senderID;
        const messageID = event.messageID || event.message_id || event.id;
        const senderID = event.senderID || event.sender_id || event.author;
        
        if (!threadID || !senderID) {
            return;
        }
        
        // 🔥 LOG DA MENSAGEM (APENAS SE TIVER TEXTO)
        if (body) {
            log.msg("RECEBIDO", `De ${senderID.slice(-6)}: "${body.slice(0, 30)}${body.length > 30 ? '...' : ''}"`);
        }
        
        // 🔥 VERIFICA WHITELIST
        if (config.whiteListMode?.enable) {
            if (!config.whiteListMode.whiteListIds.includes(senderID?.toString()) &&
                !config.adminBot.includes(senderID?.toString())) {
                return;
            }
        }
        
        // 🔥 VERIFICA SE É COMANDO
        const prefix = config.prefix || '!';
        if (!body || !body.startsWith(prefix)) {
            return;
        }
        
        // 🔥 EXTRAI O COMANDO
        const args = body.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        
        if (!commandName) {
            return;
        }
        
        // 🔥 BUSCA O COMANDO
        let command = global.SadXBot.commands.get(commandName);
        if (!command) {
            const alias = global.SadXBot.aliases.get(commandName);
            if (alias) command = global.SadXBot.commands.get(alias);
        }
        
        if (!command) {
            log.warn("COMANDO", `❌ "${commandName}" não encontrado`);
            api.sendMessage(`❌ Comando "${commandName}" não encontrado. Use ${prefix}help`, threadID);
            return;
        }
        
        // 🔥 VERIFICA SE O COMANDO ESTÁ BANIDO
        if (global.client.commandBanned?.includes(commandName)) {
            log.warn("COMANDO", `⛔ "${commandName}" banido`);
            api.sendMessage(`⛔ O comando "${commandName}" está desativado.`, threadID);
            return;
        }
        
        // 🔥 EXECUTA O COMANDO
        log.cmd("EXECUTANDO", `${commandName} (${args.length} args)`);
        try {
            const result = command.onStart({
                api,
                event,
                args,
                usersData: global.db.usersData,
                threadsData: global.db.threadsData,
                utils: global.utils,
                config: global.SadXBot.config,
                prefix: global.SadXBot.prefix
            });
            
            if (result && typeof result.then === 'function') {
                result.catch(error => {
                    log.error("COMANDO", `❌ ${commandName}: ${error.message}`);
                    api.sendMessage(`❌ Erro: ${error.message}`, threadID);
                });
            }
        } catch (error) {
            log.error("COMANDO", `❌ ${commandName}: ${error.message}`);
            api.sendMessage(`❌ Erro: ${error.message}`, threadID);
        }
        
    } catch (error) {
        log.error("HANDLER", error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// 📡 14. LISTENER
// ═══════════════════════════════════════════════════════════════

function startListener(api) {
    log.info("LISTENER", "📡 Iniciando...");
    
    api.listenMqtt((err, event) => {
        if (err) {
            log.error("LISTENER", `❌ ${err.message || err}`);
            log.info("LISTENER", "🔄 Reconectando em 5s...");
            setTimeout(() => {
                startListener(api);
            }, 5000);
            return;
        }
        
        if (!event) {
            return;
        }
        
        try {
            handleEvent(api, event);
        } catch (error) {
            log.error("LISTENER", error.message);
        }
    });
    
    // Heartbeat a cada 5 minutos (menos poluído)
    setInterval(() => {
        log.info("HEARTBEAT", "💓");
    }, 300000);
}

// ═══════════════════════════════════════════════════════════════
// 🚀 15. INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

(async function startBot() {
    try {
        console.log(`\n🌸 ${config.nickNameBot || 'SadX Bot'} iniciando...\n`);

        const appState = await getAppState();

        login({ appState, ...config.optionsFca }, async (err, api) => {
            if (err) {
                log.error("LOGIN", `Erro: ${err}`);
                process.exit(1);
            }

            log.success("LOGIN", `✅ Conectado!`);
            log.info("LOGIN", `🆔 ID: ${api.getCurrentUserID()}`);

            global.SadXBot.fcaApi = api;
            global.SadXBot.botID = api.getCurrentUserID();

            await loadData(api);
            await loadScripts(api);

            console.log(`\n🚀 ${config.nickNameBot || 'SadX Bot'} pronto!`);
            console.log(`💡 Prefixo: ${config.prefix || '!'}`);
            console.log(`👑 Admins: ${config.adminBot?.length || 0}`);
            console.log(`📅 ${new Date().toLocaleString()}\n`);

            startListener(api);
        });

    } catch (error) {
        log.error("FATAL", error.message);
        process.exit(1);
    }
})();
