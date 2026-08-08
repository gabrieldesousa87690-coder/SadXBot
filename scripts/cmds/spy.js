const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "spy",
                aliases: ["spyinfo", "quemsou"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        pt: "Verifique o perfil e estatísticas de qualquer usuário"
                },
                category: "info",
                guide: {
                        pt: '   {pn}: Veja suas informações\n   {pn} <@tag/resposta/UID>: Verifique informações do usuário'
                }
        },

        langs: {
                pt: {
                        error: "× Falha ao buscar informações: %1. Contate MahMUD para ajuda."
                }
        },

        onStart: async function ({ event, message, api, args, usersData, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { senderID, mentions, type, messageReply } = event;
                let uid = type === "message_reply" ? messageReply.senderID : Object.keys(mentions)[0] || senderID;

                if (args[0] && !args[0].startsWith("--")) {
                        if (/^\d+$/.test(args[0])) uid = args[0];
                        else {
                                const match = args[0].match(/profile\.php\?id=(\d+)/);
                                if (match) uid = match[1];
                        }
                }

                try {
                        const allUsers = await usersData.getAll();
                        const userData = await usersData.get(uid) || {};
                        const userInfo = await api.getUserInfo(uid);
                        const user = userInfo[uid] || {};

                        const money = userData.money || 0;
                        const exp = userData.exp || 0;

                        const expRank = allUsers.sort((a, b) => (b.exp || 0) - (a.exp || 0)).findIndex(u => u.userID == uid) + 1;
                        const moneyRank = allUsers.sort((a, b) => (b.money || 0) - (a.money || 0)).findIndex(u => u.userID == uid) + 1;

                        const baseUrl = await baseApiUrl();
                        let janTeach = "0", janTeachRank = "N/A";
                        
                        try {
                                const res = await axios.get(`${baseUrl}/api/jan/list/all`);
                                const entries = Object.entries(res.data?.data || {})
                                        .map(([id, val]) => ({ userID: id, value: parseInt(val) || 0 }))
                                        .sort((a, b) => b.value - a.value);

                                const userTeachData = entries.find(d => d.userID === uid);
                                if (userTeachData) {
                                        janTeach = userTeachData.value;
                                        janTeachRank = entries.findIndex(d => d.userID === uid) + 1;
                                }
                        } catch (e) {}

                        const genderText = user.gender === 1 ? "Garota" : user.gender === 2 ? "Garoto" : "Outro";
                        
                        const msg = `╭────[ 𝐈𝐍𝐅𝐎 𝐃𝐎 𝐔𝐒𝐔Á𝐑𝐈𝐎 ]
├‣ 𝙽𝚘𝚖𝚎: ${user.name || "Desconhecido"}
├‣ 𝙶ê𝚗𝚎𝚛𝚘: ${genderText}
├‣ 𝚄𝙸𝙳: ${uid}
├‣ 𝙲𝚕𝚊𝚜𝚜𝚎: AMIGO
├‣ 𝙽𝚘𝚖𝚎 𝚍𝚎 𝚞𝚜𝚞á𝚛𝚒𝚘: ${user.vanity || "nenhum"}
├‣ 𝙰𝚗𝚒𝚟𝚎𝚛𝚜á𝚛𝚒𝚘: Privado
├‣ 𝙰𝚙𝚎𝚕𝚒𝚍𝚘: Nenhum
╰‣ 𝙰𝚖𝚒𝚐𝚘 𝚍𝚘 𝚋𝚘𝚝: ${user.isFriend ? "Sim ✅" : "Não ❌"}

╭────[ 𝐄𝐒𝐓𝐀𝐓Í𝐒𝐓𝐈𝐂𝐀𝐒 ]
├‣ 𝙿𝚘𝚜𝚒çã𝚘: #${expRank}/${allUsers.length}
├‣ 𝙴𝚇𝙿: ${formatNumber(exp)}
├‣ 𝙵𝚒𝚗𝚊𝚗ç𝚊𝚜: ${formatNumber(money)}
├‣ 𝙿𝚘𝚜𝚒çã𝚘 𝚏𝚒𝚗𝚊𝚗𝚌𝚎𝚒𝚛𝚊: #${moneyRank}
╰‣ 𝙷𝚒𝚗𝚊𝚝𝚊 𝚃𝚎𝚊𝚌𝚑: ${janTeach} #${janTeachRank}`;

                        return message.reply(msg);
                } catch (err) {
                        return message.reply(getLang("error", err.message));
                }
        }
};

function formatNumber(num) {
        if (!num) return "0";
        let n = typeof num !== "number" ? parseInt(num) || 0 : num;
        const units = ["", "K", "M", "B", "T"];
        let unit = 0;
        while (n >= 1000 && ++unit < units.length) n /= 1000;
        return n.toFixed(1).replace(/\.0$/, "") + units[unit];
}
