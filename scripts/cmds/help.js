module.exports = {
    config: {
        name: "help",
        aliases: ["ajuda", "comandos"],
        version: "2.2",
        author: "SadX",
        countDown: 5,
        role: 0,
        description: {
            pt: "Mostra a lista de comandos disponíveis"
        },
        category: "info",
        guide: {
            pt: "   {pn} - Mostra todos os comandos\n   {pn} <comando> - Mostra detalhes de um comando"
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;
        const prefix = global.SadXBot?.prefix || '!';

        const commands = global.SadXBot.commands || new Map();
        const commandList = Array.from(commands.keys()).sort();

        // 🔥 DETALHES DE UM COMANDO ESPECÍFICO
        if (args.length > 0) {
            const cmdName = args[0].toLowerCase();
            const cmd = commands.get(cmdName);

            if (!cmd) {
                return api.sendMessage(`❌ Comando "${cmdName}" não encontrado.`, threadID, messageID);
            }

            const config = cmd.config;
            const aliases = config.aliases?.length ? config.aliases.join(', ') : 'Nenhum';
            const roleMap = { 0: '👤 Todos', 1: '🛡️ Admins do grupo', 2: '👑 Admin do bot' };
            const role = roleMap[config.role] || '👤 Todos';

            const msg =
                `╭─📖 **${config.name.toUpperCase()}**\n` +
                `├ 📝 Descrição: ${config.description?.pt || config.description?.en || 'Sem descrição'}\n` +
                `├ 🔗 Aliases: ${aliases}\n` +
                `├ 📦 Versão: ${config.version || '1.0'}\n` +
                `├ 👤 Autor: ${config.author || 'Desconhecido'}\n` +
                `├ ⏱️ Cooldown: ${config.countDown || 5}s\n` +
                `├ 🔒 Função: ${role}\n` +
                `├ 📂 Categoria: ${config.category || 'Geral'}\n` +
                `╰ 📖 Uso: ${config.guide?.pt?.replace(/{pn}/g, prefix) || config.guide?.en?.replace(/{pn}/g, prefix) || `${prefix}${config.name}`}`;

            return api.sendMessage(msg, threadID, messageID);
        }

        // 🔥 LISTA TODOS OS COMANDOS
        if (commandList.length === 0) {
            return api.sendMessage('📭 | Nenhum comando carregado.', threadID, messageID);
        }

        // 🔥 ORGANIZA POR CATEGORIA
        const categories = {};
        for (const name of commandList) {
            const cmd = commands.get(name);
            const category = cmd?.config?.category || 'Geral';
            if (!categories[category]) categories[category] = [];
            categories[category].push(name);
        }

        // 🔥 MONTA A MENSAGEM
        const sortedCategories = Object.keys(categories).sort();
        let msg = `╔══════════════════════════════════╗\n`;
        msg += `║   📋 **LISTA DE COMANDOS**    ║\n`;
        msg += `╠══════════════════════════════════╣\n`;

        for (const category of sortedCategories) {
            const cmds = categories[category].sort();
            msg += `┃ ✦ ${category.toUpperCase()}\n`;
            for (const cmd of cmds) {
                msg += `┃   ✧ ${cmd}\n`;
            }
            msg += `┃\n`;
        }

        msg += `╠══════════════════════════════════╣\n`;
        msg += `║ 📦 Total: ${commandList.length} comandos ║\n`;
        msg += `╚══════════════════════════════════╝\n\n`;
        msg += `💡 Use ${prefix}help <comando> para ver detalhes.`;

        return api.sendMessage(msg, threadID, messageID);
    }
};
