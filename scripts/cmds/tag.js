
module.exports = {
        config: {
                name: "tag",
                version: "1.7",
                author: "MahMUD",
                countDown: 0,
                role: 0,
                category: "utility",
                guide: {
                        pt: "{pn} [resposta/@menção/nome] [texto]"
                }
        },

        langs: {
                pt: {
                        no_user: "❌ Usuário não encontrado neste grupo!",
                        guide_msg: "⚠️ Por favor, responda, marque ou digite um nome!",
                        error: "❌ Ocorreu um erro: %1"
                }
        },

        onStart: async function ({ api, event, args, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                try {
                        const { threadID, messageID, messageReply, mentions } = event;
                        let uid;
                        let text = args.join(" ");

                        if (messageReply) {
                                uid = messageReply.senderID;
                        }

                        else if (Object.keys(mentions).length > 0) {
                                uid = Object.keys(mentions)[0];    
                                text = text.replace(/@\S+/g, "").trim();
                        }

                        else if (args.length > 0) {
                                const nameInput = args[0].toLowerCase();
                                const threadInfo = await api.getThreadInfo(threadID);
                                const member = threadInfo.userInfo.find(u =>
                                        u.name.toLowerCase().includes(nameInput)
                                );

                                if (!member) return api.sendMessage(getLang("no_user"), threadID, messageID);

                                uid = member.id;
                                text = args.slice(1).join(" ");
                        }

                        else {
                                return api.sendMessage(getLang("guide_msg"), threadID, messageID);
                        }

                        const userInfo = await api.getUserInfo(uid);
                        const name = userInfo[uid]?.name || "Usuário";

                        return api.sendMessage({
                                body: `${name} ${text}`,
                                mentions: [{
                                        tag: name,
                                        id: uid
                                }]
                        }, threadID, messageID);

                } catch (e) {
                        console.log(e);
                        return api.sendMessage(getLang("error", e.message), event.threadID, event.messageID);
                }
        }
};