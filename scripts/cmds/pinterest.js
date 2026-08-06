const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "pin",
                aliases: ["pinterest", "pic", "imagem"],
                version: "1.7",
                author: "Gerson",
                countDown: 10,
                role: 0,
                description: {
                        pt: "Pesquise e baixe imagens do Pinterest"
                },
                category: "image gen",
                guide: {
                        pt: '   {pn} <consulta> - <quantidade>: (Ex: {pn} goku - 10)'
                }
        },

        langs: {
                pt: {
                        noInput: "× Baby, digite uma consulta e a quantidade! 🔍\nExemplo: {pn} goku - 10",
                        noData: "× Desculpe, nenhuma imagem encontrada para sua consulta.",
                        success: "✅ | Aqui estão %2 imagens para \"%1\":",
                        error: "× Erro na API: %1. Contate Gerson para ajuda.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const queryAndLength = args.join(" ").split("-");
                const keySearch = queryAndLength[0]?.trim();
                const count = queryAndLength[1]?.trim();
                const numberSearch = count ? Math.min(parseInt(count), 20) : 6;

                if (!keySearch) return message.reply(getLang("noInput"));

                const cacheDir = path.join(__dirname, "cache");
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const apiUrl = await mahmud();
                        const response = await axios.get(
                                `${apiUrl}/api/pin/mahmud?query=${encodeURIComponent(keySearch)}&limit=${numberSearch}`
                        );

                        const data = response.data.images;
                        if (!data || data.length === 0) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("noData"));
                        }

                        const attachments = [];
                        const filePaths = [];
                        for (let i = 0; i < data.length; i++) {
                                try {
                                        const imgRes = await axios.get(data[i], { responseType: "arraybuffer" });
                                        const imgPath = path.join(cacheDir, `pin_${Date.now()}_${i}.jpg`);
                                        await fs.outputFile(imgPath, imgRes.data);
                                        filePaths.push(imgPath);
                                        attachments.push(fs.createReadStream(imgPath));
                                } catch (imgErr) {
                                        console.error(`Erro ao baixar imagem ${i}:`, imgErr);
                                }
                        }

                        if (attachments.length === 0) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("noData"));
                        }

                        await message.reply({
                                body: getLang("success", keySearch, attachments.length),
                                attachment: attachments
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                filePaths.forEach(filePath => {
                                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                                });
                        });

                } catch (err) {
                        console.error("Pinterest Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.message));
                }
        }
};
