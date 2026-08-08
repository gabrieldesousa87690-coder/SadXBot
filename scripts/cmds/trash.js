
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports = {
  config: {
    name: "trash",
    aliases: ["lixo"],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: {
      pt: "trash [menção-resposta-UID]"
    }
  },

  onStart: async function ({ api, event, args }) {
     const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
     if (module.exports.config.author !== obfuscatedAuthor) {
     return api.sendMessage(
     "You are not authorized to change the author name.", event.threadID, event.messageID );
   }

    const { threadID, messageID, messageReply, mentions } = event;
    let id2; if (messageReply) { id2 = messageReply.senderID; } else if (Object.keys(mentions).length > 0) {
    id2 = Object.keys(mentions)[0];  } else if (args[0]) {  id2 = args[0]; } else {
    return api.sendMessage( "Baby, marque, responda ou forneça o UID do alvo.", threadID, messageID );
  }

   try {
    const url = `${await baseApiUrl()}/api/dig?type=trash&user=${id2}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const filePath = path.join(__dirname, `trash_${id2}.png`);
    fs.writeFileSync(filePath, response.data);

     
    api.sendMessage({ attachment: fs.createReadStream(filePath),
    body: `𝐄𝐟𝐞𝐢𝐭𝐨 𝐥𝐢𝐱𝐨 𝐚𝐩𝐥𝐢𝐜𝐚𝐝𝐨 𝐜𝐨𝐦 𝐬𝐮𝐜𝐞𝐬𝐬𝐨 🐸`,
     },
    threadID, () => fs.unlinkSync(filePath),  messageID );
  } catch (err) {
    console.error(err);
    api.sendMessage(`🥹 Erro, contate MahMUD.`, threadID, messageID);
    }
  },
};