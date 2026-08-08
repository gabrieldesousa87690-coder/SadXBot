const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "pair4",
        aliases: ["par4", "casal4", "match4"],
        version: "1.7",
        author: "MahMUD",  // ✅ MANTIDO IGUAL AO ORIGINAL
        countDown: 10,
        role: 0,
        description: {
            pt: "Encontre seu par perfeito entre os membros do grupo (estilo 4)"
        },
        category: "love",
        guide: {
            pt: "   {pn}: Use para encontrar seu par"
        }
    },

    onStart: async function ({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const outputPath = path.join(__dirname, "cache", `pair_${senderID}_${Date.now()}.png`);
        
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        try {
            api.setMessageReaction("😘", messageID, () => { }, true);

            const threadData = await api.getThreadInfo(threadID);
            const users = threadData.userInfo;
            const myData = users.find((u) => u.id === senderID);

            if (!myData || !myData.gender) {
                return api.sendMessage("❌ Seu gênero não está definido no seu perfil do Facebook.", threadID, messageID);
            }

            const myGender = myData.gender.toUpperCase();
            let matchCandidates = [];

            if (myGender === "MALE") {
                matchCandidates = users.filter((u) => u.gender === "FEMALE" && u.id !== senderID);
            } else if (myGender === "FEMALE") {
                matchCandidates = users.filter((u) => u.gender === "MALE" && u.id !== senderID);
            } else {
                matchCandidates = users.filter((u) => u.id !== senderID);
            }

            if (matchCandidates.length === 0) {
                api.setMessageReaction("🥺", messageID, () => { }, true);
                return api.sendMessage("❌ Desculpe, não encontrei ninguém para você neste grupo 😢", threadID, messageID);
            }

            const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
            const apiUrl = await baseApiUrl();

            const { data } = await axios.get(`${apiUrl}/api/pair/mahmud?user1=${senderID}&user2=${selectedMatch.id}&style=4`, {
                responseType: "arraybuffer"
            });

            fs.writeFileSync(outputPath, Buffer.from(data));

            const name1 = myData.name || "Usuário";
            const name2 = selectedMatch.name || "Parceiro";
            const percentage = Math.floor(Math.random() * 100) + 1;

            const msg =
                `💞 CASAL PERFEITO\n\n` +
                `👤 ${name1}\n` +
                `❤️  ${name2}\n\n` +
                `📊 Compatibilidade: ${percentage}%`;

            return api.sendMessage({
                body: msg,
                attachment: fs.createReadStream(outputPath)
            }, threadID, () => {
                api.setMessageReaction("✅", messageID, () => { }, true);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, messageID);

        } catch (err) {
            console.error("Pair Error:", err);
            api.setMessageReaction("❌", messageID, () => { }, true);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            return api.sendMessage(`❌ Erro: ${err.message}`, threadID, messageID);
        }
    }
};
