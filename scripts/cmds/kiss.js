const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "kiss",
                aliases: ["beijo"],
                version: "1.7",
                author: "Gerson",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Gere uma imagem de beijo romântico marcando alguém"
                },
                category: "love",
                guide: {
                        pt: '   {pn} <@tag>: Marque alguém para beijar'
                                + '\n   {pn} <uid>: Beijar por UID'
                                + '\n   (Ou responda à mensagem de alguém)'
                }
        },

        langs: {
                pt: {
                        noTarget: "× Baby, marque, responda ou forneça o UID de alguém para beijar! 💋",
                        wait: "Gerando sua imagem de beijo... Por favor, aguarde um momento baby! <😘",
                        success: "Aqui está sua imagem de beijo baby! 🙈",
                        error: "× Erro na API: %1. Contate Gerson para ajuda."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const senderID = event.senderID;
                let targetID;

                // Verificar se há menção
                if (Object.keys(event.mentions).length > 0) {
                        targetID = Object.keys(event.mentions)[0];
                } 
                // Verificar se é resposta a uma mensagem
                else if (event.messageReply) {
                        targetID = event.messageReply.senderID;
                } 
                // Verificar se é UID
                else if (args[0] && !isNaN(args[0])) {
                        targetID = args[0];
                }

                if (!targetID) return message.reply(getLang("noTarget"));

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const imgPath = path.join(cacheDir, `kiss_${senderID}_${targetID}.png`);

                try {
                        api.setMessageReaction("😘", event.messageID, () => {}, true);
                        const waitMsg = await message.reply(getLang("wait"));

                        const base = await mahmud();
                        const response = await axios.post(`${base}/api/kiss`, 
                                { senderID, targetID }, 
                                { responseType: "arraybuffer" }
                        );

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
                        console.error("Kiss Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
