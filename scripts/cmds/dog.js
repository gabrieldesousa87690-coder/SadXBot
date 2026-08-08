const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "dog",
                aliases: ["cachorro"],
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        bn: "Gerar uma imagem com seu cachorro pessoal",
                        en: "Generate a image with your dog one",
                        vi: "Gerar uma imagem com seu cachorro pessoal"
                },
                category: "diversão",
                guide: {
                        bn: '   {pn} @menção: Marque alguém para usar',
                        en: '   {pn} @mention: Mention someone to use',
                        vi: '   {pn} @menção: Marque alguém para usar'
                }
        },

        langs: {
                bn: {
                        noMention: "× Querido, marque alguém!",
                        success: "𝐀𝐪𝐮𝐢 𝐞𝐬𝐭𝐚́ 𝐬𝐞𝐮 𝐜𝐚𝐜𝐡𝐨𝐫𝐫𝐨 𝐩𝐞𝐬𝐬𝐨𝐚𝐥 𝐪𝐮𝐞𝐫𝐢𝐝𝐨 🐸",
                        error: "× Ocorreu um problema: %1. Contate MahMUD se necessário.\n•WhatsApp: 01836298139"
                },
                en: {
                        noMention: "× Baby, please mention someone!",
                        success: "𝐇𝐞𝐫𝐞’𝐬 𝐲𝐨𝐮𝐫 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐥 𝐃𝐨𝐠 𝐛𝐚𝐛𝐲 🐸",
                        error: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                },
                vi: {
                        noMention: "× Querido, marque alguém!",
                        success: "Aqui está sua imagem, querido",
                        error: "× Erro: %1. Contate MahMUD para suporte.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, event, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author.trim() !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const mentions = Object.keys(event.mentions);
                if (mentions.length === 0) return message.reply(getLang("noMention"));

                const senderID = event.senderID;
                const targetID = mentions[0];
                const imgPath = path.join(__dirname, "cache", `dog_${senderID}_${targetID}.png`);
                if (!fs.existsSync(path.dirname(imgPath))) fs.mkdirSync(path.dirname(imgPath), { recursive: true });

                try {
                     
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        
                        const base = await mahmud();
                        const response = await axios.post(`${base}/api/dog`, 
                                { senderID, targetID }, 
                                { responseType: "arraybuffer" }
                        );

                        fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

                        return message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(imgPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        });

                } catch (err) {
                        console.error("dog Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};