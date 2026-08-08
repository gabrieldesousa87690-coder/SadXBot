const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "buttslap",
                aliases: ["butslap"],
                version: "1.7",
                author: "MahMUD",
                role: 0,
                category: "diversão",
                cooldown: 8,
                guide: {
                        en: "{pn} [mention/reply/UID]",
                        bn: "{pn} [menção/resposta/UID]",
                        vi: "{pn} [menção/resposta/UID]"
                }
        },

        langs: {
                bn: {
                        usage: "• Como usar: buttslap @menção ou responda a uma mensagem.",
                        error: "❌ Ocorreu um erro: contate MahMUD %1",
                        success: "Efeito: buttslap feito com sucesso"
                },
                en: {
                        usage: "• Usage: buttslap @mention or reply to a message.",
                        error: "❌ An error occurred: contact MahMUD %1",
                        success: "Effect: buttslap successful"
                },
                vi: {
                        usage: "• Como usar: buttslap @menção ou responda a uma mensagem.",
                        error: "❌ Ocorreu um erro: contate MahMUD %1",
                        success: "Efeito: buttslap feito com sucesso"
                }
        },

        onStart: async function ({ api, event, args, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { threadID, messageID, messageReply, mentions, senderID } = event;

                let id2;
                if (messageReply) {
                        id2 = messageReply.senderID;
                } else if (Object.keys(mentions).length > 0) {
                        id2 = Object.keys(mentions)[0];
                } else if (args[0]) {
                        id2 = args[0];
                } else {
                        return api.sendMessage(getLang("usage"), threadID, messageID);
                }

                try {
                        api.setMessageReaction("⏳", messageID, () => { }, true);

                        const apiUrl = await baseApiUrl();
                        const url = `${apiUrl}/api/dig?type=buttslap&user=${senderID}&user2=${id2}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        
                        const cacheDir = path.join(__dirname, 'cache');
                        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                        
                        const filePath = path.join(cacheDir, `slap_${id2}_${Date.now()}.png`);
                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        api.sendMessage({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, threadID, (err) => {
                                if (!err) {
                                        api.setMessageReaction("🪽", messageID, () => { }, true);
                                }
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        }, messageID);

                } catch (err) {
                        api.setMessageReaction("❌", messageID, () => { }, true);
                        api.sendMessage(getLang("error", err.message || "API Error"), threadID, messageID);
                }
        }
};