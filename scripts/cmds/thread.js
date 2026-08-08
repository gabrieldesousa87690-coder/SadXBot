const { getTime } = global.utils;

module.exports = {
        config: {
                name: "thread",
                version: "1.5",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Gerenciar grupos no sistema do bot"
                },
                category: "owner",
                guide: {
                        pt: "   {pn} [find | -f | search | -s] <nome a procurar>: procurar grupo no banco de dados do bot pelo nome"
                                + "\n   {pn} [find | -f | search | -s] [-j | joined] <nome a procurar>: procurar grupo no banco de dados onde o bot ainda está participando"
                                + "\n   {pn} [ban | -b] [<tid> | deixar em branco] <motivo>: banir grupo com id <tid> ou grupo atual de usar o bot"
                                + "\n   Exemplo:"
                                + "\n    {pn} ban 3950898668362484 spam no bot"
                                + "\n    {pn} ban spam demais"
                                + "\n\n   {pn} unban [<tid> | deixar em branco] para desbanir grupo com id <tid> ou grupo atual"
                                + "\n   Exemplo:"
                                + "\n    {pn} unban 3950898668362484"
                                + "\n    {pn} unban"
                }
        },

        langs: {
                pt: {
                        noPermission: "Você não tem permissão para usar este recurso",
                        found: "🔎 Encontrado %1 grupo correspondendo à palavra-chave \"%2\" no banco de dados do bot:\n%3",
                        notFound: "❌ Nenhum grupo encontrado com a palavra-chave: \"%1\" no banco de dados do bot",
                        hasBanned: "Grupo com id [%1 | %2] já foi banido anteriormente:\n» Motivo: %3\n» Data: %4",
                        banned: "Grupo com id [%1 | %2] banido de usar o bot.\n» Motivo: %3\n» Data: %4",
                        notBanned: "Atualmente o grupo com id [%1 | %2] não está banido de usar o bot",
                        unbanned: "Grupo com tid [%1 | %2] desbanido de usar o bot",
                        missingReason: "O motivo do banimento não pode ficar vazio",
                        info: "» Box ID: %1\n» Nome: %2\n» Data de criação: %3\n» Total de membros: %4\n» Homens: %5 membros\n» Mulheres: %6 membros\n» Total de mensagens: %7%8"
                }
        },

        onStart: async function ({ args, threadsData, message, role, event, getLang }) {
                const type = args[0];

                switch (type) {
                        case "find":
                        case "search":
                        case "-f":
                        case "-s": {
                                if (role < 2)
                                        return message.reply(getLang("noPermission"));
                                let allThread = await threadsData.getAll();
                                let keyword = args.slice(1).join(" ");
                                if (['-j', '-join'].includes(args[1])) {
                                        allThread = allThread.filter(thread => thread.members.some(member => member.userID == global.GoatBot.botID && member.inGroup));
                                        keyword = args.slice(2).join(" ");
                                }
                                const result = allThread.filter(item => item.threadID.length > 15 && (item.threadName || "").toLowerCase().includes(keyword.toLowerCase()));
                                const resultText = result.reduce((i, thread) => i += `\n╭Nome: ${thread.threadName}\n╰ID: ${thread.threadID}`, "");
                                let msg = "";
                                if (result.length > 0)
                                        msg += getLang("found", result.length, keyword, resultText);
                                else
                                        msg += getLang("notFound", keyword);
                                message.reply(msg);
                                break;
                        }
                        case "ban":
                        case "-b": {
                                if (role < 2)
                                        return message.reply(getLang("noPermission"));
                                let tid, reason;
                                if (!isNaN(args[1])) {
                                        tid = args[1];
                                        reason = args.slice(2).join(" ");
                                }
                                else {
                                        tid = event.threadID;
                                        reason = args.slice(1).join(" ");
                                }
                                if (!tid)
                                        return message.SyntaxError();
                                if (!reason)
                                        return message.reply(getLang("missingReason"));
                                reason = reason.replace(/\s+/g, ' ');
                                const threadData = await threadsData.get(tid);
                                const name = threadData.threadName;
                                const status = threadData.banned.status;

                                if (status)
                                        return message.reply(getLang("hasBanned", tid, name, threadData.banned.reason, threadData.banned.date));
                                const time = getTime("DD/MM/YYYY HH:mm:ss");
                                await threadsData.set(tid, {
                                        banned: {
                                                status: true,
                                                reason,
                                                date: time
                                        }
                                });
                                return message.reply(getLang("banned", tid, name, reason, time));
                        }
                        case "unban":
                        case "-u": {
                                if (role < 2)
                                        return message.reply(getLang("noPermission"));
                                let tid;
                                if (!isNaN(args[1]))
                                        tid = args[1];
                                else
                                        tid = event.threadID;
                                if (!tid)
                                        return message.SyntaxError();

                                const threadData = await threadsData.get(tid);
                                const name = threadData.threadName;
                                const status = threadData.banned.status;

                                if (!status)
                                        return message.reply(getLang("notBanned", tid, name));
                                await threadsData.set(tid, {
                                        banned: {}
                                });
                                return message.reply(getLang("unbanned", tid, name));
                        }
                        case "info":
                        case "-i": {
                                let tid;
                                if (!isNaN(args[1]))
                                        tid = args[1];
                                else
                                        tid = event.threadID;
                                if (!tid)
                                        return message.SyntaxError();
                                const threadData = await threadsData.get(tid);
                                const createdDate = getTime(threadData.createdAt, "DD/MM/YYYY HH:mm:ss");
                                const valuesMember = Object.values(threadData.members).filter(item => item.inGroup);
                                const totalBoy = valuesMember.filter(item => item.gender == "MALE").length;
                                const totalGirl = valuesMember.filter(item => item.gender == "FEMALE").length;
                                const totalMessage = valuesMember.reduce((i, item) => i += item.count, 0);
                                const infoBanned = threadData.banned.status ?
                                        `\n- Banido: ${threadData.banned.status}`
                                        + `\n- Motivo: ${threadData.banned.reason}`
                                        + `\n- Data: ${threadData.banned.date}` :
                                        "";
                                const msg = getLang("info", threadData.threadID, threadData.threadName, createdDate, valuesMember.length, totalBoy, totalGirl, totalMessage, infoBanned);
                                return message.reply(msg);
                        }
                        default:
                                return message.SyntaxError();
                }
        }
};