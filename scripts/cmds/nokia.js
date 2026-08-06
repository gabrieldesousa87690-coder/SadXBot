const axios = require("axios");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "nokia",
                version: "1.7",
                author: "Gerson",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Gere uma imagem no estilo tela da Nokia"
                },
                category: "fun",
                guide: {
                        pt: '   {pn} @menção: Gerar com usuário mencionado' +
                                '\n   {pn} [resposta]: Gerar com usuário respondido' +
                                '\n   {pn} [UID]: Forneça um ID de usuário'
                }
        },

        langs: {
                pt: {
                        provide: "• Por favor, marque alguém, responda a uma mensagem ou forneça um UID.",
                        success: "📱 | Aqui está seu efeito de tela da Nokia!",
                        error: "× Erro na API: %1. Contate Gerson para ajuda."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                try {
                        let uid;

                        // Verificar menção
                        if (Object.keys(event.mentions).length > 0) {
                                uid = Object.keys(event.mentions)[0];
                        } 
                        // Verificar resposta a mensagem
                        else if (event.messageReply) {
                                uid = event.messageReply.senderID;
                        } 
                        // Verificar UID
                        else if (args[0] && !isNaN(args[0])) {
                                uid = args[0];
                        } 
                        else {
                                return message.reply(getLang("provide"));
                        }

                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const baseURL = await mahmud();
                        const imageUrl = `${baseURL}/api/nokia?uid=${uid}`;
                        const stream = await global.utils.getStreamFromURL(imageUrl);

                        api.setMessageReaction("✅", event.messageID, () => {}, true);

                        return message.reply({
                                body: getLang("success"),
                                attachment: stream
                        });

                } catch (err) {
                        console.error("Nokia Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
