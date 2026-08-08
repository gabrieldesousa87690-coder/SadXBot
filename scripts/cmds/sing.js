const axios = require("axios");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "sing",
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        bn: "Pesquisar e baixar qualquer música como arquivo de áudio",
                        en: "Search and download any song as an audio file",
                        vi: "Pesquisar e baixar qualquer música como arquivo de áudio"
                },
                category: "música",
                guide: {
                        bn: '   {pn} <nome da música>: Digite o nome para baixar a música',
                        en: '   {pn} <song name>: Enter song name to download',
                        vi: '   {pn} <nome da música>: Digite o nome para baixar a música'
                }
        },

        langs: {
                bn: {
                        noInput: "× Querido, digite o nome da música! 🎵\nExemplo: {pn} shape of you",
                        success: "✅ | Aqui está sua música, querido <😘\n• 𝐌𝐮𝐬𝐢𝐜𝐚: %1",
                        error: "× Ocorreu um problema: %1. Contate MahMUD se necessário."
                },
                en: {
                        noInput: "× Baby, please provide a song name! 🎵\nExample: {pn} shape of you",
                        success: "✅ | Here's your requested song baby <😘\n• 𝐒𝐨𝐧𝐠: %1",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noInput: "× Querido, forneça o nome da música! 🎵\nExemplo: {pn} shape of you",
                        success: "✅ | Aqui está sua música, querido <😘\n• 𝐌𝐮𝐬𝐢𝐜𝐚: %1",
                        error: "× Erro: %1. Contate MahMUD para suporte."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const query = args.join(" ");
                if (!query) return message.reply(getLang("noInput"));

                try {
                        api.setMessageReaction("⌛", event.messageID, () => {}, true);

                        const baseUrl = await mahmud();
                        const apiUrl = `${baseUrl}/api/song/mahmud?query=${encodeURIComponent(query)}`;

                        const response = await axios({
                                method: "GET",
                                url: apiUrl,
                                responseType: "stream"
                        });

                        return message.reply({
                                body: getLang("success", query),
                                attachment: response.data
                        }, () => {
                                api.setMessageReaction("🪽", event.messageID, () => {}, true);
                        });

                } catch (err) {
                        console.error("Sing Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};