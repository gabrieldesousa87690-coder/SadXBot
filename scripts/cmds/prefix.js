module.exports = {
    config: {
        name: "prefix",
        aliases: ["pref", "prefixo"],
        version: "1.0",
        author: "SadX",
        countDown: 3,
        role: 0,
        description: {
            pt: "Mostra ou altera o prefixo do grupo"
        },
        category: "admin",
        guide: {
            pt: "   {pn}: Mostra os prefixos\n"
                + "   {pn} set <novo_prefixo>: Altera o prefixo do grupo (admin)\n"
                + "   Exemplo: {pn} set ?"
        }
    },

    onStart: async function ({ api, event, args, threadsData }) {
        const { threadID, messageID, senderID } = event;
        const botPrefix = global.SadXBot?.prefix || '!';
        
        // 🔥 ALTERAR PREFIXO DO GRUPO (só admin)
        if (args[0] === 'set' && args[1]) {
            // Verifica se é admin do grupo
            const threadInfo = await api.getThreadInfo(threadID);
            const isAdmin = threadInfo.adminIDs?.some(admin => admin.id == senderID);
            
            if (!isAdmin) {
                return api.sendMessage("❌ Apenas administradores do grupo podem mudar o prefixo!", threadID, messageID);
            }

            const newPrefix = args[1];
            await threadsData.set(threadID, newPrefix, "data.prefix");
            
            return api.sendMessage(
                `✅ Prefixo do grupo alterado para: ${newPrefix}`,
                threadID,
                messageID
            );
        }

        // 🔥 MOSTRA OS PREFIXOS
        let groupPrefix = botPrefix;
        try {
            const threadData = await threadsData.get(threadID);
            if (threadData?.data?.prefix) {
                groupPrefix = threadData.data.prefix;
            }
        } catch (error) {
            groupPrefix = botPrefix;
        }

        const msg =
            `╔══════════════════════════╗\n` +
            `║ 📋 PREFIXOS             ║\n` +
            `╠══════════════════════════╣\n` +
            `║ 🤖 Bot: ${botPrefix.padEnd(16)}║\n` +
            `║ 📫 Grupo: ${groupPrefix.padEnd(14)}║\n` +
            `╠══════════════════════════╣\n` +
            `║ 💡 ${groupPrefix}help       ║\n` +
            `║ 💡 ${groupPrefix}prefix set ?║\n` +
            `╚══════════════════════════╝`;

        return api.sendMessage(msg, threadID, messageID);
    }
};
