const axios = require("axios");
 
const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "emojimix",
                aliases: ["mix", "emojis"],
                version: "1.7",
                author: "Gerson",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Misture dois emojis para criar um novo sticker"
                },
                category: "fun",
                guide: {
                        pt: '   {pn} <emoji1> <emoji2>\n   Exemplo: {pn} 🙂 😘'
                }
        },

        langs: {
                pt: {
                        error: "× Desculpe baby, os emojis %1 e %2 não podem ser misturados. 🥺",
                        success: "✨ | Emojis %1 e %2 misturados com sucesso!",
                        invalid: "• Por favor, forneça dois emojis\n\nExemplo: {pn} 😘 🙂"
                }
        },

        onStart: async function ({ api, message, event, args, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68); 
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const prefix = global.utils.getPrefix(event.threadID);
                const [emoji1, emoji2] = args;

                if (!emoji1 || !emoji2) {
                        const invalidMsg = getLang("invalid").replace(/{pn}/g, prefix + this.config.name);
                        return api.sendMessage(invalidMsg, event.threadID, event.messageID);
                }

                try {
                        api.setMessageReaction("✨", event.messageID, () => {}, true);
                        const image = await generateEmojimix(emoji1, emoji2);

                        if (!image) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return api.sendMessage(getLang("error", emoji1, emoji2), event.threadID, event.messageID);
                        }

                        return api.sendMessage({
                                body: getLang("success", emoji1, emoji2),
                                attachment: image
                        }, event.threadID, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                        }, event.messageID);

                } catch (e) {
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return api.sendMessage(getLang("error", emoji1, emoji2), event.threadID, event.messageID);
                }
        }
};

async function generateEmojimix(emoji1, emoji2) {
        try {
                const baseUrl = await baseApiUrl();
                const apiUrl = `${baseUrl}/api/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;
                const response = await axios.get(apiUrl, {
                        headers: { "Author": "MahMUD" },
                        responseType: "stream"
                });

                if (response.data.error) return null;
                return response.data;
        } catch (error) {
                return null;
        }
}
