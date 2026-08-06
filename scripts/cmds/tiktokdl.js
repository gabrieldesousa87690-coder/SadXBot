const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
        return base.data.mahmud69;
};

module.exports = {
        config: {
                name: "tiktokdl",
                aliases: ["ttdl", "tikdl"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        pt: "Baixe vídeos do TikTok"
                },
                category: "media",
                guide: {
                        pt: '   {pn} <link>: Forneça o link do vídeo do TikTok'
                                + '\n   Ou responda a um link com {pn}'
                                + '\n\nPlataformas Suportadas:\n• TikTok / Douyin'
                }
        },

        langs: {
                pt: {
                        noLink: "× Baby, forneça um link válido do TikTok ou responda a um!",
                        error: "× Erro no download: %1. Contate MahMUD para ajuda.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, message, args, event, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const mahmud = args[0] || event.messageReply?.body;

                if (!mahmud || !mahmud.startsWith("http")) {
                        return message.reply(getLang("noLink"));
                }

                if (!(
                        mahmud.includes("tiktok.com") || 
                        mahmud.includes("douyin.com")
                )) {
                        return message.reply(getLang("noLink"));
                }

                if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
                const path = __dirname + `/cache/ttdl_${Date.now()}.mp4`;

                try {
                        api.setMessageReaction("🐤", event.messageID, () => {}, true);
                        
                        const base = await baseApiUrl();
                        const apiUrl = `${base}/api/download?url=${encodeURIComponent(mahmud)}`;
                        
                        const apiRes = await axios.get(apiUrl);
                        if (!apiRes.data || !apiRes.data.result) {
                                throw new Error("Failed to fetch video URL from API");
                        }

                        const videoUrl = apiRes.data.result;
                        const caption = apiRes.data.cp || "Vídeo Baixado"; 

                        const response = await axios({
                                method: 'get',
                                url: videoUrl,
                                responseType: 'arraybuffer'
                        });

                        fs.writeFileSync(path, Buffer.from(response.data, "binary"));

                        api.setMessageReaction("🪽", event.messageID, () => {}, true);

                        return message.reply(
                                {
                                        body: caption,
                                        attachment: fs.createReadStream(path)
                                },
                                () => fs.unlinkSync(path)
                        );

                } catch (err) {
                        console.error("Error in tiktokdl command:", err);
                        api.setMessageReaction("❎", event.messageID, () => {}, true);
                        if (fs.existsSync(path)) fs.unlinkSync(path);
                        return message.reply(getLang("error", err.message));
                }
        }
};
