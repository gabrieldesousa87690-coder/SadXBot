const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "tuntun",
                version: "1.7",
                author: "MahMUD",
                role: 0,
                category: "fun",
                cooldown: 10,
                guide: {
                        pt: "{pn} [menção/resposta/UID]"
                }
        },

        langs: {
                pt: {
                        noTarget: "• Baby, marque, responda ou forneça o UID do alvo",
                        error: "❌ Ocorreu um erro: contate MahMUD %1",
                        success: "Efeito tuntun aplicado com sucesso"
                }
        },

        onStart: async function ({ api, event, args, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { threadID, messageID, messageReply, mentions } = event;
                let id2 = messageReply?.senderID || Object.keys(mentions)[0] || args[0];

                if (!id2) return api.sendMessage(getLang("noTarget"), threadID, messageID);

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                const filePath = path.join(cacheDir, `clown_${id2}_${Date.now()}.png`);

                try {
                        api.setMessageReaction("⏳", messageID, () => { }, true);

                        const apiUrl = await baseApiUrl();
                        const url = `${apiUrl}/api/dig?type=tuntun&user=${id2}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
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
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        api.sendMessage(getLang("error", err.message || "API Error"), threadID, messageID);
                }
        }
};
