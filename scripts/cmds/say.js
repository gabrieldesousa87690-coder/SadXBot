const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "say",
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Converta qualquer texto em áudio ou mensagem de voz"
                },
                category: "media",
                guide: {
                        pt: '   {pn} <texto>: (ou responda a uma mensagem)'
                }
        },

        langs: {
                pt: {
                        noInput: "× Baby, escreva algo ou responda a uma mensagem",
                        error: "× Erro na API: %1. Contate MahMUD para ajuda."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                let text = args.join(" ");
                if (event.type === "message_reply" && event.messageReply.body) {
                        text = event.messageReply.body;
                }

                if (!text) return message.reply(getLang("noInput"));

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const baseUrl = await baseApiUrl();
                        const response = await axios.get(`${baseUrl}/api/say`, {
                                params: { text },
                                headers: { "Author": authorName },
                                responseType: "stream"
                        });

                        return message.reply({
                                body: "",
                                attachment: response.data
                        }, () => {
                                api.setMessageReaction("🪽", event.messageID, () => {}, true);
                        });

                } catch (err) {
                        console.error("Say Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        const errorMsg = err.response?.data?.error || err.message;
                        return message.reply(getLang("error", errorMsg));
                }
        }
};
