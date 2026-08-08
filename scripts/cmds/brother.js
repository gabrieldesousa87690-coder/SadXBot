const fs = require("fs");
const axios = require("axios");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "brother",
                aliases: ["bro", "irmão"],
                version: "1.7",
                author: "MahMud",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Crie uma imagem doce da relação entre irmãos"
                },
                category: "love",
                guide: {
                        pt: '   {pn} <@tag/resposta>: Marque ou responda a alguém'
                }
        },

        langs: {
                pt: {
                        noTarget: "× Baby, por favor marque ou responda a alguém! 🎀",
                        wait: "⌛ Gerando sua imagem... Por favor, aguarde um momento baby! <😘",
                        success: "𝐀 𝐯𝐢𝐝𝐚 é 𝐦𝐞𝐥𝐡𝐨𝐫 𝐜𝐨𝐦 𝐮𝐦 𝐈𝐫𝐦ã𝐨 𝐚𝐨 𝐬𝐞𝐮 𝐥𝐚𝐝𝐨 🎀",
                        error: "× Erro na API: %1. Contate Gerson para ajuda."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const mention = Object.keys(event.mentions)[0] || (event.messageReply && event.messageReply.senderID);
                if (!mention) return message.reply(getLang("noTarget"));

                const user1 = mention;
                const user2 = event.senderID;
                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const imgPath = path.join(cacheDir, `brother_${user1}_${user2}.png`);

                try {
                        api.setMessageReaction("🎀", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const baseUrl = await baseApiUrl();
                        const apiUrl = `${baseUrl}/api/bro&sis?user1=${user1}&user2=${user2}&style=1`;

                        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
                        fs.writeFileSync(imgPath, Buffer.from(response.data));

                        if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(imgPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        });

                } catch (err) {
                        console.error("Brother Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
