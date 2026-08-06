const fs = require("fs");
const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports.config = {
  name: "myboy",
  version: "1.7",
  role: 0,
  author: "Gerson",
  category: "love",
  cooldowns: 5,
  description: {
    pt: "Crie uma imagem romântica para seu amor"
  },
  guide: {
    pt: "   {pn} <@tag/resposta>: Marque ou responda a pessoa amada"
  }
};

module.exports.langs = {
  pt: {
    noTarget: "× Por favor, marque ou responda a 1 pessoa 💕",
    success: "𝐄𝐒𝐒𝐄 É 𝐌𝐄𝐔 𝐀𝐌𝐎𝐑 🖤",
    error: "🥹 Erro, contate Gerson."
  }
};

module.exports.onStart = async ({ event, api, args, getLang }) => {
  const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }
  try {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions)[0] || (event.messageReply && event.messageReply.senderID);

    if (!mention)
      return api.sendMessage(getLang("noTarget"), threadID, messageID);

    const user1 = mention;
    const user2 = senderID;

    const baseUrl = await baseApiUrl();
    const apiUrl = `${baseUrl}/api/myboy?user1=${user1}&user2=${user2}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    const cacheDir = __dirname + "/cache";
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    
    const imgPath = __dirname + `/cache/myboy_${user1}_${user2}.png`;
    fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

    api.sendMessage({
      body: getLang("success"),
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }, messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(getLang("error"), event.threadID, event.messageID);
  }
};
