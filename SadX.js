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
const { execSync } = require('child_process');
const login = require('mahmud-fca');
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require('qs');
const request = require("request").defaults({ jar: true, simple: false });

// ═══════════════════════════════════════════════════════════════
// 📂 3. LOG (SISTEMA DE LOGS SIMPLIFICADO)
// ═══════════════════════════════════════════════════════════════

const log = {
    info: (tag, msg) => console.log(`📘 [${tag}] ${msg}`),
    success: (tag, msg) => console.log(`✅ [${tag}] ${msg}`),
    warn: (tag, msg) => console.log(`⚠️ [${tag}] ${msg}`),
    error: (tag, msg) => console.log(`❌ [${tag}] ${msg}`),
    master: (tag, msg) => console.log(`👑 [${tag}] ${msg}`),
    err: (tag, msg) => console.log(`❌ [${tag}] ${msg}`)
};

// ═══════════════════════════════════════════════════════════════
// 🔍 4. FUNÇÃO: VALIDA ARQUIVOS JSON
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// 📂 5. CAMINHOS DOS ARQUIVOS
// ═══════════════════════════════════════════════════════════════

const dirConfig = path.normalize(`${__dirname}/config.json`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands.json`);
const dirAccount = path.normalize(`${__dirname}/account.txt`);

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
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds))
    config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map(id => id.toString());
const configCommands = require(dirConfigCommands);

// ═══════════════════════════════════════════════════════════════
// 🌐 6. OBJETO GLOBAL DO BOT
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
    botID: null
};

// ═══════════════════════════════════════════════════════════════
// 🗄️ 7. BANCO DE DADOS
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
// 🧠 8. OBJETO GLOBAL DO CLIENTE
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

global.utils = {
    colors: {
        gray: (t) => t,
        hex: (c, t) => t,
        green: (t) => t,
        red: (t) => t,
        yellow: (t) => t
    },
    getText: (a, b) => b,
    convertTime: (ms) => `${Math.floor(ms / 1000)}s`,
    loading: { info: () => {} }
};

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

async function loginMbasic(email, pass) {
    const targetCookie = "https://m.facebook.com/";
    const headers = {
        "user-agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36"
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
// 🔑 10. LOADSCRIPTS E LOADDATA (EMBUTIDOS)
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
        } catch (e) {
            errors++;
            log.error("LOAD", `❌ ${file}: ${e.message}`);
        }
    }

    log.success("LOAD", `📦 ${loaded} comandos carregados${errors ? `, ${errors} falhas` : ''}`);
}

async function loadData(api) {
    const usersPath = path.join(__dirname, 'database', 'data', 'usersData.json');
    const threadsPath = path.join(__dirname, 'database', 'data', 'threadsData.json');

    let users = [];
    let threads = [];

    try {
        if (fs.existsSync(usersPath)) users = fs.readJSONSync(usersPath);
        if (fs.existsSync(threadsPath)) threads = fs.readJSONSync(threadsPath);
    } catch (e) {
        log.warn("DATABASE", `Erro ao carregar dados: ${e.message}`);
    }

    global.db.allUserData = users;
    global.db.allThreadData = threads;

    // 🔥 Cria o usersData com métodos básicos
    global.db.usersData = {
        get: async (userID) => {
            return global.db.allUserData.find(u => u.userID == userID) || null;
        },
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
        get: async (threadID) => {
            return global.db.allThreadData.find(t => t.threadID == threadID) || null;
        },
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

    log.info("DATABASE", `👥 ${global.db.allUserData.length} usuários`);
    log.info("DATABASE", `💬 ${global.db.allThreadData.length} grupos`);

    return {
        usersData: global.db.usersData,
        threadsData: global.db.threadsData
    };
}

// ═══════════════════════════════════════════════════════════════
// 🔑 11. FUNÇÃO: OBTER APPSTATE
// ═══════════════════════════════════════════════════════════════

async function getAppState() {
    try {
        const accountData = fs.readFileSync(dirAccount, 'utf8');
        const parsed = JSON.parse(accountData);

        // 🔥 SE FOR ARRAY DE COOKIES
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].key) {
            return parsed;
        }

        // 🔥 SE FOR TOKEN (EAAAA...)
        if (typeof parsed === 'string' && parsed.startsWith('EAAAA')) {
            log.info("LOGIN", "🔑 Token detectado, obtendo appstate...");
            return await getFbstate(parsed);
        }

        // 🔥 SE FOR EMAIL/SENHA
        if (Array.isArray(parsed) && parsed.length === 2) {
            log.info("LOGIN", "📧 Email/senha detectado, tentando login via mbasic...");
            return await loginMbasic(parsed[0], parsed[1]);
        }

        return parsed;
    } catch (e) {
        log.error("LOGIN", `Erro ao ler account.txt: ${e.message}`);
        log.info("LOGIN", "💡 account.txt deve conter: appstate (JSON), token (EAAAA...) ou email/senha");
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════════
// 🔑 12. HANDLER DE EVENTOS
// ═══════════════════════════════════════════════════════════════

function handleEvent(api, event) {
    const { threadID, messageID, senderID, body } = event;

    if (senderID === api.getCurrentUserID()) return;

    if (body && body.startsWith('!')) {
        const args = body.slice(1).split(' ');
        const commandName = args.shift().toLowerCase();

        const command = global.SadXBot.commands.get(commandName) ||
                        global.SadXBot.commands.get(global.SadXBot.aliases.get(commandName));

        if (command) {
            log.info("COMANDO", `📩 ${commandName} de ${senderID}`);
            try {
                command.onStart({
                    api,
                    event,
                    args,
                    usersData: global.db.usersData,
                    threadsData: global.db.threadsData
                });
            } catch (e) {
                log.error("COMANDO", `❌ ${commandName}: ${e.message}`);
                api.sendMessage(`❌ Erro: ${e.message}`, threadID, messageID);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 13. INICIALIZAÇÃO DO BOT
// ═══════════════════════════════════════════════════════════════

(async function startBot() {
    try {
        console.log('🌸 SadX Bot iniciando...');

        const appState = await getAppState();

        login({ appState }, async (err, api) => {
            if (err) {
                log.error("LOGIN", `Erro: ${err}`);
                process.exit(1);
            }

            log.success("LOGIN", `✅ Conectado ao Facebook!`);
            log.info("LOGIN", `🆔 Bot ID: ${api.getCurrentUserID()}`);

            global.SadXBot.fcaApi = api;
            global.SadXBot.botID = api.getCurrentUserID();

            // 🔥 CARREGA DADOS E COMANDOS
            await loadData(api);
            await loadScripts(api);

            log.success("START", `🚀 Bot pronto para uso!`);
            log.info("START", `📅 ${new Date().toLocaleString()}`);
            log.info("START", `💡 Prefixo: ${config.prefix || '!'}`);

            // 🔥 INICIA O LISTENER
            api.listenMqtt((err, event) => {
                if (err) {
                    log.error("LISTENER", `Erro: ${err}`);
                    return;
                }
                handleEvent(api, event);
            });
        });

    } catch (error) {
        log.error("FATAL", `Erro fatal: ${error.message}`);
        process.exit(1);
    }
})();
