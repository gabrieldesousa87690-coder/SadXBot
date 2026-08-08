const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "rip",
                aliases: ["túmulo"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        bn: "Criar uma imagem de lápide RIP para alguém",
                        en: "Create a RIP tombstone edit image of someone",
                        vi: "Criar imagem de lápide RIP para alguém"
                },
                category: "diversão",
                guide: {
                        bn: '   {pn} <menção/resposta/UID>: Use para criar a imagem da lápide',
                        en: '   {pn} <mention/reply/UID>: Use to create tombstone image',
                        vi: '   {pn} <menção/resposta/UID>: Use para criar imagem de lápide'
                }
        },

        langs: {
                bn: {
                        noTarget: "× Querido, quem você quer enterrar? Menção, resposta ou UID! 🐸",
                        success: "𝐄𝐟𝐞𝐢𝐭𝐨 𝐑𝐈𝐏 𝐟𝐞𝐢𝐭𝐨 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨 <😘",
                        error: "× Ocorreu um problema: %1. Contate MahMUD se necessário."
                },
                en: {
                        noTarget: "× Baby, mention, reply, or provide UID of the target! 🐸",
                        success: "𝐄𝐟𝐟𝐞𝐜𝐭 𝐑𝐈𝐏 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐛𝐚𝐛𝐲 <😘",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noTarget: "× Querido, mencione, responda ou forneça o UID! 🐸",
                        success: "𝐄𝐟𝐞𝐢𝐭𝐨 𝐑𝐈𝐏 𝐟𝐞𝐢𝐭𝐨 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨 <😘",
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

                const cacheDir = path.join(__dirname, "cache");
                const filePath = path.join(cacheDir, `rip_${id2}_${Date.now()}.png`);
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                try {
                        
                        api.setMessageReaction("⏳", messageID, () => {}, true);

                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/dig?type=rip&user=${id2}`;
                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        
                        fs.writeFileSync(filePath, response.data);

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                api.setMessageReaction("🪽", messageID, () => {}, true);
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("RIP Error:", err);
                        api.setMessageReaction("❌", messageID, () => {}, true);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        const errorMsg = err.response?.data?.error || err.message;
                        return message.reply(getLang("error", errorMsg));
                }
        }
};