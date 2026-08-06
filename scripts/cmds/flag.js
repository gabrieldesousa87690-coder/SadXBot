const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "flaggame",
        aliases: ["flag", "bandeira"],
        version: "1.0",
        author: "SadX",
        countDown: 10,
        role: 0,
        description: {
            pt: "Adivinhe o país pela bandeira"
        },
        category: "jogo",
        guide: {
            pt: "   {pn}: Digite para iniciar o jogo"
        }
    },

    onReply: async function ({ api, event, Reply, usersData }) {
        const { flag, author } = Reply;
        const getCoin = 500;
        const getExp = 121;

        if (event.senderID !== author) {
            return api.sendMessage("❌ Esta não é sua bandeira! Inicie o jogo você mesmo.", event.threadID, event.messageID);
        }

        const reply = event.body.trim().toLowerCase();
        const userData = await usersData.get(event.senderID);

        await api.unsendMessage(Reply.messageID);

        if (reply === flag.toLowerCase()) {
            userData.money += getCoin;
            userData.exp += getExp;
            await usersData.set(event.senderID, userData);

            return api.sendMessage(
                `✅ Resposta correta!\n\n💰 Você ganhou ${getCoin} moedas\n⭐ Ganhou ${getExp} XP`,
                event.threadID,
                event.messageID
            );
        } else {
            return api.sendMessage(
                `❌ Resposta errada!\n\n🏳️ A resposta correta era: ${flag}`,
                event.threadID,
                event.messageID
            );
        }
    },

    onStart: async function ({ api, event }) {
        try {
            const apiUrl = await baseApiUrl();
            const response = await axios.get(`${apiUrl}/api/flag`, {
                responseType: "json",
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const { link, country } = response.data;

            const imageStream = await axios({
                method: "GET",
                url: link,
                responseType: "stream",
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            return api.sendMessage({
                body: "🌍 Uma bandeira apareceu! Adivinhe o país, baby!",
                attachment: imageStream.data
            },
            event.threadID,
            (err, info) => {
                if (err) return api.sendMessage("❌ Falha ao enviar a bandeira.", event.threadID);

                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    flag: country
                });

                setTimeout(() => {
                    api.unsendMessage(info.messageID);
                }, 40000);
            },
            event.messageID
            );
        } catch (error) {
            console.error("FlagGame Error:", error.message);
            return api.sendMessage(`❌ Erro: ${error.message}`, event.threadID, event.messageID);
        }
    }
};
