const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "pair", // Nome alterado de "pair3" para "pair"
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        bn: "Encontre sua combinação perfeita entre os membros do grupo",
                        en: "Find your perfect match among group members",
                        vi: "Encontre sua combinação perfeita entre os membros do grupo"
                },
                category: "amor",
                guide: {
                        bn: '   {pn}: Use para encontrar sua combinação',
                        en: '   {pn}: Use to find your match',
                        vi: '   {pn}: Use para encontrar sua combinação'
                }
        },

        langs: {
                bn: {
                        noGender: "× Querido, seu gênero não está definido no seu perfil",
                        noMatch: "× Desculpe, nenhuma combinação encontrada para você neste grupo",
                        success: "💞 𝐂𝐨𝐦𝐛𝐢𝐧𝐚𝐜̧𝐚̃𝐨 𝐟𝐞𝐢𝐭𝐚 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨\n• %1\n• %2\n\n𝐏𝐨𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞𝐦 𝐝𝐞 𝐚𝐦𝐨𝐫: %3%",
                        error: "× Ocorreu um problema: %1. Contate MahMUD se necessário."
                },
                en: {
                        noGender: "× Baby, your gender is not defined in your profile",
                        noMatch: "× Sorry, no match found for you in this group",
                        success: "💞 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐏𝐚𝐢𝐫𝐢𝐧𝐠\n• %1\n• %2\n\n𝐋𝐨𝐯𝐞 𝐏𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞: %3%",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noGender: "× Querido, seu gênero não está definido no seu perfil",
                        noMatch: "× Desculpe, nenhuma combinação encontrada para você neste grupo",
                        success: "💞 𝐂𝐨𝐦𝐛𝐢𝐧𝐚𝐜̧𝐚̃𝐨 𝐟𝐞𝐢𝐭𝐚 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨\n• %1\n• %2\n\n𝐏𝐨𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞𝐦 𝐝𝐞 𝐚𝐦𝐨𝐫: %3%",
                        error: "× Erro: %1. Contate MahMUD para suporte."
                }
        },

        onStart: async function ({ api, event, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const outputPath = path.join(__dirname, "cache", `pair_${event.senderID}_${Date.now()}.png`);
                if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

                try {
                        api.setMessageReaction("😘", event.messageID, () => {}, true);

                        const threadData = await api.getThreadInfo(event.threadID);
                        const users = threadData.userInfo;
                        const myData = users.find((u) => u.id === event.senderID);

                        if (!myData || !myData.gender) return message.reply(getLang("noGender"));

                        const myGender = myData.gender.toUpperCase();
                        let matchCandidates = [];

                        if (myGender === "MALE") {
                                matchCandidates = users.filter((u) => u.gender === "FEMALE" && u.id !== event.senderID);
                        } else if (myGender === "FEMALE") {
                                matchCandidates = users.filter((u) => u.gender === "MALE" && u.id !== event.senderID);
                        } else {
                                matchCandidates = users.filter((u) => u.id !== event.senderID);
                        }
                        
                        if (matchCandidates.length === 0) {
                                api.setMessageReaction("🥺", event.messageID, () => {}, true);
                                return message.reply(getLang("noMatch"));
                        }

                        const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
                        const apiUrl = await baseApiUrl();
                        
                        const { data } = await axios.get(`${apiUrl}/api/pair/mahmud?user1=${event.senderID}&user2=${selectedMatch.id}&style=3`, { 
                                responseType: "arraybuffer" 
                        });

                        fs.writeFileSync(outputPath, Buffer.from(data));

                        const name1 = myData.name || "User";
                        const name2 = selectedMatch.name || "Partner";
                        const percentage = Math.floor(Math.random() * 100) + 1;

                        return message.reply({
                                body: getLang("success", name1, name2, percentage),
                                attachment: fs.createReadStream(outputPath)
                        }, () => {
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                        });

                } catch (err) {
                        console.error("Pair Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                        return message.reply(getLang("error", err.message));
                }
        }
};