const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "hitler",
                aliases: ["hitler"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        bn: "Criar uma imagem engraçada de Hitler para alguém",
                        en: "Create a funny Hitler image of someone",
                        vi: "Criar uma imagem engraçada de Hitler para alguém"
                },
                category: "diversão",
                guide: {
                        bn: '   {pn} <@marcar/resposta/UID>: Marque/responda para transformar alguém em Hitler',
                        en: '   {pn} <@tag/reply/UID>: Tag/Reply to make someone Hitler',
                        vi: '   {pn} <@marcar/resposta/UID>: Marque/responda para transformar alguém em Hitler'
                }
        },

        langs: {
                bn: {
                        noTarget: "× Querido, mencione, responda ou forneça o UID do alvo! 🎖️",
                        success: "Aqui está sua imagem de Hitler, querido! 🐸",
                        error: "× Ocorreu um problema: %1. Contate MahMUD se necessário."
                },
                en: {
                        noTarget: "× Baby, mention, reply, or provide UID of the target! 🎖️",
                        success: "Here's your Hitler image baby! 🐸",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noTarget: "× Querido, mencione, responda ou forneça o UID! 🎖️",
                        success: "Aqui está sua imagem de Hitler, querido! 🐸",
                        error: "× Erro: %1. Contate MahMUD para suporte."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { mentions, messageReply } = event;
                let id;

                if (Object.keys(mentions).length > 0) {
                        id = Object.keys(mentions)[0];
                } else if (messageReply) {
                        id = messageReply.senderID;
                } else if (args[0] && !isNaN(args[0])) {
                        id = args[0];
                }

                if (!id) return message.reply(getLang("noTarget"));

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                const filePath = path.join(cacheDir, `hitler_${id}.png`);

                try {
                        api.setMessageReaction("🎖️", event.messageID, () => {}, true);
                        
                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/dig?type=hitler&user=${id}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        fs.writeFileSync(filePath, Buffer.from(response.data));

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        }, () => {
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        });

                } catch (err) {
                        console.error("Hitler Error:", err);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};