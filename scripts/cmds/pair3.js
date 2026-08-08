const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "pair",
                version: "1.7",
                author: "MahMud",
                countDown: 10,
                role: 0,
                description: {
                        pt: "Encontre seu par perfeito entre os membros do grupo"
                },
                category: "love",
                guide: {
                        pt: '   {pn}: Use para encontrar seu par'
                }
        },

        langs: {
                pt: {
                        noGender: "× Baby, seu gênero não está definido no seu perfil",
                        noMatch: "× Desculpe, nenhum par encontrado para você neste grupo",
                        success: "💞 𝐏𝐚𝐫 𝐞𝐧𝐜𝐨𝐧𝐭𝐫𝐚𝐝𝐨 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨\n• %1\n• %2\n\n𝐏𝐨𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞𝐦 𝐝𝐞 𝐚𝐦𝐨𝐫: %3%",
                        error: "× Erro na API: %1. Contate Gerson para ajuda."
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

                        const name1 = myData.name || "Usuário";
                        const name2 = selectedMatch.name || "Parceiro(a)";
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
