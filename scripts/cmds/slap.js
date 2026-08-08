
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
        config: {
                name: "slap",
                aliases: ["tapa"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        pt: "Crie uma imagem de tapa em alguém"
                },
                category: "fun",
                guide: {
                        pt: '   {pn} <@tag>: Dar um tapa em um usuário marcado'
                                + '\n   {pn} <uid>: Dar um tapa por UID'
                                + '\n   (Ou responda à mensagem de alguém)'
                }
        },

        langs: {
                pt: {
                        noTarget: "× Baby, marque ou responda a alguém para dar um tapa!",
                        success: "Aqui está um tapa! A cara ficou vermelha 💥",
                        error: "× Falha ao dar tapa: %1. Contate MahMUD para ajuda."
                }
        },

        onStart: async function ({ api, message, args, event, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { senderID, messageReply, mentions } = event;
                let id2;

                if (messageReply) {
                        id2 = messageReply.senderID;
                } else if (Object.keys(mentions).length > 0) {
                        id2 = Object.keys(mentions)[0];
                } else if (args[0] && !isNaN(args[0])) {
                        id2 = args[0];
                }

                if (!id2) return message.reply(getLang("noTarget"));

                try {
                        const baseUrl = await baseApiUrl();
                        const url = `${baseUrl}/api/dig?type=slap&user=${senderID}&user2=${id2}`;

                        const response = await axios.get(url, { responseType: "arraybuffer" });
                        const cachePath = path.join(__dirname, "cache", `slap_${id2}.png`);
                        
                        if (!fs.existsSync(path.join(__dirname, "cache"))) {
                                fs.mkdirSync(path.join(__dirname, "cache"));
                        }

                        fs.writeFileSync(cachePath, Buffer.from(response.data));

                        await message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(cachePath)
                        });

                        fs.unlinkSync(cachePath);
                } catch (err) {
                        console.error("Error in slap command:", err);
                        return message.reply(getLang("error", err.message));
                }
        }
};