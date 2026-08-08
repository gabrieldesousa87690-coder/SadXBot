const axios = require("axios");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "play",
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        pt: "Pesquise e reproduza qualquer música como arquivo de áudio"
                },
                category: "music",
                guide: {
                        pt: '   {pn} <nome da música>: Digite o nome da música para tocar'
                }
        },

        langs: {
                pt: {
                        noInput: "× Baby, forneça o nome da música! 🎵\nExemplo: {pn} mood",
                        success: "✅ | Aqui está sua música baby <😘\n• 𝐌ú𝐬𝐢𝐜𝐚: %1",
                        error: "× Erro na API: %1. Contate MahMUD para ajuda."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const query = args.join(" ");
                if (!query) {
                        api.setMessageReaction("🥹", event.messageID, () => {}, true);
                        return message.reply(getLang("noInput"));
                }

                try {
                        api.setMessageReaction("🐤", event.messageID, () => {}, true);

                        const baseUrl = await mahmud();
                        const apiUrl = `${baseUrl}/api/play?mahmud=${encodeURIComponent(query)}`;

                        const response = await axios({
                                method: "GET",
                                url: apiUrl,
                                responseType: "stream",
                                headers: { author: authorName }
                        });

                        return message.reply({
                                body: getLang("success", query),
                                attachment: response.data
                        }, () => {
                                api.setMessageReaction("🪽", event.messageID, () => {}, true);
                        });

                } catch (err) {
                        console.error("Play Error:", err);
                        api.setMessageReaction("🥹", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
