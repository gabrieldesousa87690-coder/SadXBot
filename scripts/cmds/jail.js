const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "jail",
                aliases: ["prisão"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        bn: "Criar uma imagem de prisão para alguém",
                        en: "Create a jail edit image of someone",
                        vi: "Criar uma imagem de prisão para alguém"
                },
                category: "diversão",
                guide: {
                        bn: '   {pn} <menção/resposta/UID>: Use para colocar alguém na prisão',
                        en: '   {pn} <mention/reply/UID>: Use to put someone in jail',
                        vi: '   {pn} <menção/resposta/UID>: Use para colocar alguém na prisão'
                }
        },

        langs: {
                bn: {
                        noTarget: "× Querido, quem você quer prender? Menção, resposta ou UID! 🐸",
                        success: "𝐄𝐟𝐞𝐢𝐭𝐨 𝐩𝐫𝐢𝐬𝐚̃𝐨 𝐟𝐞𝐢𝐭𝐨 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨 <😘",
                        error: "× Ocorreu um problema: %1. Contate MahMUD se necessário."
                },
                en: {
                        noTarget: "× Baby, mention, reply, or provide UID of the target! 🐸",
                        success: "𝐄𝐟𝐟𝐞𝐜𝐭 𝐣𝐚𝐢𝐥 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐛𝐚𝐛𝐲 <😘",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noTarget: "× Querido, mencione, responda ou forneça o UID! 🐸",
                        success: "𝐄𝐟𝐞𝐢𝐭𝐨 𝐩𝐫𝐢𝐬𝐚̃𝐨 𝐟𝐞𝐢𝐭𝐨 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨 <😘",
                        error: "× Erro: %1. Contate MahMUD para suporte."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { threadID, messageID, messageReply, mentions } = event;
                let id2;
                if (messageReply) id2 = messageReply.senderID;
                else if (Object.keys(mentions).length > 0) id2 = Object.keys(mentions)[0];
                else if (args[0]) id2 = args[0];
                else return message.reply(getLang("noTarget"));

                const filePath = path.join(__dirname, "cache", `jail_${id2}_${Date.now()}.png`);
                if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });

                try {
                        
                        api.setMessageReaction("⏳", messageID, () => {}, true);

                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/dig?type=jail&user=${id2}`;
                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        
                        fs.writeFileSync(filePath, response.data);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                api.setMessageReaction("✅", messageID, () => {}, true);
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Jail Error:", err);
                        api.setMessageReaction("❌", messageID, () => {}, true);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};