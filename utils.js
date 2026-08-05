// ═══════════════════════════════════════════════════════════════
// 📦 UTILS.JS - FUNÇÕES UTILITÁRIAS
// ═══════════════════════════════════════════════════════════════

const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

// 🔥 CORES PARA TERMINAL
const colors = {
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    hex: (color, text) => `\x1b[38;2;${parseInt(color.slice(1,3), 16)};${parseInt(color.slice(3,5), 16)};${parseInt(color.slice(5,7), 16)}m${text}\x1b[0m`
};

// 🔥 LOGS
const log = {
    info: (tag, msg) => console.log(`📘 [${tag}] ${msg}`),
    success: (tag, msg) => console.log(`✅ [${tag}] ${msg}`),
    warn: (tag, msg) => console.log(`⚠️ [${tag}] ${msg}`),
    error: (tag, msg) => console.log(`❌ [${tag}] ${msg}`),
    master: (tag, msg) => console.log(`👑 [${tag}] ${msg}`),
    err: (tag, msg) => console.log(`❌ [${tag}] ${msg}`)
};

// 🔥 CONVERTER TEMPO
function convertTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// 🔥 STRING ALEATÓRIA
function randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 🔥 GET PREFIXO
function getPrefix(threadID) {
    // 🔥 PODE ADICIONAR LÓGICA DE PREFIXO POR GRUPO AQUI
    return global.SadXBot?.prefix || '!';
}

// 🔥 GET TEXTO (TRADUÇÃO SIMPLES)
function getText(category, key, ...args) {
    // 🔥 SISTEMA DE TRADUÇÃO SIMPLES
    const texts = {
        loadData: {
            loadThreadDataSuccess: (count) => `${count} grupos carregados`,
            loadUserDataSuccess: (count) => `${count} usuários carregados`
        },
        loadScripts: {
            loadScriptsError: (type) => `Erro ao carregar ${type}`
        },
        login: {
            loginSuccess: 'Login realizado com sucesso!'
        }
    };

    let text = texts[category]?.[key] || key;
    if (typeof text === 'function') {
        return text(...args);
    }
    return text;
}

// 🔥 LOADING (SPINNER)
function createOraDots(text) {
    let interval = null;
    let count = 0;
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    return {
        _start: () => {
            interval = setInterval(() => {
                process.stdout.write(`\r${spinner[count % spinner.length]} ${text}`);
                count++;
            }, 80);
        },
        _stop: () => {
            clearInterval(interval);
            process.stdout.write('\r\x1b[K');
        },
        text: (newText) => {
            text = newText;
        }
    };
}

// 🔥 REMOVE HOME DIR
function removeHomeDir(filePath) {
    return filePath.replace(process.cwd(), '');
}

// 🔥 JSON COLORIDO
function jsonStringifyColor(obj, replacer = null, space = 2) {
    return JSON.stringify(obj, replacer, space);
}

// 🔥 LOAD SCRIPTS (SIMPLIFICADO)
function loadScripts(type, name, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData) {
    try {
        const pathFile = path.join(process.cwd(), 'scripts', type, `${name}.js`);
        if (!fs.existsSync(pathFile)) {
            return { status: 'error', error: new Error(`File not found: ${name}.js`) };
        }

        const command = require(pathFile);
        const commandName = command.config?.name || name;

        if (type === 'cmds') {
            global.SadXBot.commands.set(commandName, command);
        } else if (type === 'events') {
            global.SadXBot.eventCommands.set(commandName, command);
        }

        return { status: 'success', command };
    } catch (error) {
        return { status: 'error', error };
    }
}

// 🔥 EXPORTA TUDO
module.exports = {
    colors,
    log,
    convertTime,
    randomString,
    getPrefix,
    getText,
    createOraDots,
    removeHomeDir,
    jsonStringifyColor,
    loadScripts
};
