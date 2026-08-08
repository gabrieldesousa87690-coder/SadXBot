const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "tiksr",
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        bn: "Pesquise e baixe vídeos de edição do TikTok",
                        en: "Search and download TikTok edit videos",
                        vi: "Pesquisar e baixar vídeos de edição do TikTok"
                },
                category: "mídia",
                guide: {
                        bn: '   {pn} <palavra-chave>: Digite o nome para pesquisar vídeo (ex: {pn} naruto)',
                        en: '   {pn} <keyword>: Enter keyword to search (Ex: {pn} naruto)',
                        vi: '   {pn} <palavra-chave>: Digite a palavra-chave para pesquisar (Ex: {pn} naruto)'
                }
        },

        langs: {
                bn: {
                        noInput: "× Querido, o que você quer pesquisar? 🔍\nExemplo: {pn} naruto",
                        tooLarge: "× O vídeo é muito grande (mais de 25 MB). Pesquise outra coisa!",
                        success: "• 𝐀𝐪𝐮𝐢 𝐞𝐬𝐭𝐚́ 𝐬𝐞𝐮 𝐯𝐢𝐝𝐞𝐨 𝐝𝐞 𝐞𝐝𝐢𝐜̧𝐚̃𝐨 𝐝𝐨 𝐓𝐢𝐤𝐓𝐨𝐤.\n• 𝐏𝐞𝐬𝐪𝐮𝐢𝐬𝐚: %1",
                        error: "× Ocorreu um problema: %1. Contate MahMUD se necessário."
                },
                en: {
                        noInput: "× Baby, what do you want to search? 🔍\nExample: {pn} naruto",
                        tooLarge: "× Video is too large (25MB+). Try another keyword!",
                        success: "• 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐓𝐢𝐤𝐓𝐨𝐤 𝐄𝐝𝐢𝐭 𝐕𝐢𝐝𝐞𝐨.\n• 𝐒𝐞𝐚𝐫𝐜𝐡: %1",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noInput: "× Querido, o que você quer pesquisar? 🔍\nExemplo: {pn} naruto",
                        tooLarge: "× Vídeo muito grande (25MB+). Tente outra palavra-chave!",
                        success: "• 𝐕𝐢𝐝𝐞𝐨 𝐝𝐞 𝐞𝐝𝐢𝐜̧𝐚̃𝐨 𝐓𝐢𝐤𝐓𝐨𝐤 𝐝𝐨 𝐪𝐮𝐞𝐫𝐢𝐝𝐨 𝐚𝐪𝐮𝐢.\n• 𝐏𝐞𝐬𝐪𝐮𝐢𝐬𝐚: %1",
                        error: "× Erro: %1. Contate MahMUD para suporte."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const keyword = args.join(" ");
                if (!keyword) return message.reply(getLang("noInput"));

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                const videoPath = path.join(cacheDir, `tiksr_${Date.now()}.mp4`);

                try {
                        api.setMessageReaction("⌛", event.messageID, () => {}, true);

                        const apiUrl = await baseApiUrl();
                        const res = await axios({
                                method: "GET",
                                url: `${apiUrl}/api/tiksr`,
                                params: { sr: keyword },
                                responseType: "stream"
                        });

                        const writer = fs.createWriteStream(videoPath);
                        res.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                                writer.on("finish", resolve);
                                writer.on("error", reject);
                        });

                        const stat = fs.statSync(videoPath);
                        if (stat.size > 26214400) { 
                                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("tooLarge"));
                        }

                        await message.reply({
                                body: getLang("success", keyword),
                                attachment: fs.createReadStream(videoPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        });

                } catch (err) {
                        console.error("TikEdit Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};