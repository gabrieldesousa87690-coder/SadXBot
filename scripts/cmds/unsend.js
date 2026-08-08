module.exports = {
        config: {
                name: "unsend",
                aliases:["uns", "un", "u", "r"],
                version: "1.2",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Remover mensagem do bot"
                },
                category: "box chat",
                guide: {
                        pt: "responda a mensagem que deseja remover e chame o comando {pn}"
                }
        },

        langs: {
                pt: {
                        syntaxError: "Por favor, responda a mensagem que deseja remover"
                }
        },

        onStart: async function ({ message, event, api, getLang }) {
                if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
                        return message.reply(getLang("syntaxError"));
                message.unsend(event.messageReply.messageID);
        }
};
