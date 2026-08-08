const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "gay",
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        bn: "Dar um efeito gay para alguém",
                        en: "Give someone a gay effect",
                        vi: "Dar um efeito gay para alguém"
                },
                category: "diversão",
                guide: {
                        bn: '   {pn} <@marcar>: Dar efeito gay marcando'
                                + '\n   {pn} <uid>: Criar efeito usando UID'
                                + '\n   (Ou use respondendo a uma mensagem)',
                        en: '   {pn} <@tag>: Give gay effect by tagging'
                                + '\n   {pn} <uid>: Create effect using UID'
                                + '\n   (Or use by replying to a message)',
                        vi: '   {pn} <@marcar>: Dar efeito gay marcando'
                                + '\n   {pn} <uid>: Criar efeito usando UID'
                                + '\n   (Ou use respondendo a uma mensagem)'
                }
        },

        langs: {
                bn: {
                        noTarget: "× Querido, mencione, responda ou forneça o UID do alvo! 🐸",
                        success: "𝐄𝐟𝐞𝐢𝐭𝐨 𝐠𝐚𝐲 𝐟𝐞𝐢𝐭𝐨 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨 🐸",
                        error: "× Falha ao criar efeito: %1. Contate MahMUD para ajuda."
                },
                en: {
                        noTarget: "× Baby, mention, reply, or provide UID of the target! 🐸",
                        success: "𝐄𝐟𝐟𝐞𝐜𝐭 𝐠𝐚𝐲 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 🐸",
                        error: "× Failed to create effect: %1. Contact MahMUD for help."
                },
                vi: {
                        noTarget: "× Querido, mencione, responda ou forneça o UID do alvo! 🐸",
                        success: "Efeito gay feito com sucesso 🐸",
                        error: "× Falha ao criar efeito: %1. Contate MahMUD para suporte."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { mentions, messageReply } = event;
                let id2;

                if (messageReply) {
                        id2 = messageReply.senderID;
                } else if (Object.keys(mentions).length > 0) {
                        id2 = Object.keys(mentions)[0];
                } else if (args[0] && !isNaN(args[0])) {
                        id2 = args[0];
                }

                if (!id2) return message.reply(getLang("noTarget"));

                const cacheDir = path.join(__dirname, "cache");
                const filePath = path.join(cacheDir, `gay_${id2}.png`);

                try {
                        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/dig?type=gay&user=${id2}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Gay Effect Error:", err);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};