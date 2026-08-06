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
        aliases: ["match", "par", "casal"],
        version: "1.0",
        author: "SadX",
        countDown: 10,
        role: 0,
        description: {
            pt: "Encontre seu par perfeito entre os membros do grupo"
        },
        category: "diversão",
        guide: {
            pt: "   {pn}: Use para encontrar seu par"
        }
    },

    onStart: async function ({ api, event, message }) {
        const outputPath = path.join(__dirname, "cache", `pair_${event.senderID}_${Date.now()}.png`);
        if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        try {
            api.setMessageReaction("😘", event.messageID, () => { }, true);

            const threadData = await api.getThreadInfo(event.threadID);
            const users = threadData.userInfo;
            const myData = users.find((u) => u.id === event.senderID);

            if (!myData || !myData.gender) {
                return message.reply("❌ Seu gênero não está definido no seu perfil do Facebook.");
            }

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
                api.setMessageReaction("🥺", event.messageID, () => { }, true);
                return message.reply("❌ Desculpe, não encontrei ninguém para você neste grupo 😢");
            }

            const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
            const apiUrl = await baseApiUrl();

            const { data } = await axios.get(`${apiUrl}/api/pair/mahmud?user1=${event.senderID}&user2=${selectedMatch.id}&style=3`, {
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

            return message.reply({
                body: msg,
                attachment: fs.createReadStream(outputPath)
            }, () => {
                api.setMessageReaction("✅", event.messageID, () => { }, true);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            });

        } catch (err) {
            console.error("Pair Error:", err);
            api.setMessageReaction("❌", event.messageID, () => { }, true);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            return message.reply(`❌ Erro: ${err.message}`);
        }
    }
};
