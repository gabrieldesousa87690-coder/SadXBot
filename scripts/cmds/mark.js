const axios = require("axios");
const fs = require("fs-extra");
const canvas = require("canvas");

module.exports = {
  config: {
    name: "mark",
    author: "MahMud",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      pt: "Crie um comentário no quadro",
    },
    guide: {
      pt: "   {pn} <texto>: Escreva algo no quadro"
    }
  },

  wrapText: async (ctx, text, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);
      const words = text.split(" ");
      const lines = [];
      let line = "";
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
          line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = "";
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  },

  onStart: async function ({ api, event, args, message }) {
    let { senderID, threadID, messageID } = event;
    const { loadImage, createCanvas } = require("canvas");
    const fs = require("fs-extra");
    const axios = require("axios");
    
    let pathImg = __dirname + "/cache/mark.png";
    var text = args.join(" ");
    
    if (!text) {
      return api.sendMessage(
        "⚠️ | Por favor, insira o conteúdo do comentário no quadro\n\nExemplo: {pn} Olá mundo!",
        threadID,
        messageID
      );
    }

    // Criar diretório cache se não existir
    if (!fs.existsSync(__dirname + "/cache")) {
      fs.mkdirSync(__dirname + "/cache", { recursive: true });
    }

    try {
      let getPorn = (
        await axios.get(`https://i.postimg.cc/gJCXgKv4/zucc.jpg`, {
          responseType: "arraybuffer",
        })
      ).data;
      
      fs.writeFileSync(pathImg, Buffer.from(getPorn, "utf-8"));
      let baseImage = await loadImage(pathImg);
      let canvas = createCanvas(baseImage.width, baseImage.height);
      let ctx = canvas.getContext("2d");
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      
      // Configuração inicial da fonte
      ctx.textAlign = "start";
      ctx.fillStyle = "#000000";
      
      // Ajuste automático do tamanho da fonte baseado no comprimento do texto
      let fontSize = 100;
      let maxWidth = 470;
      let lines = [];
      
      // Reduz o tamanho da fonte até caber na largura máxima
      do {
        ctx.font = `700 ${fontSize}px Arial, sans-serif`;
        lines = await this.wrapText(ctx, text, maxWidth);
        fontSize -= 5;
      } while (lines && lines.length > 4 && fontSize > 20);
      
      // Se ainda houver muitas linhas, reduz mais
      if (lines && lines.length > 4) {
        fontSize = Math.max(20, fontSize - 10);
        ctx.font = `700 ${fontSize}px Arial, sans-serif`;
        lines = await this.wrapText(ctx, text, maxWidth);
      }
      
      // Se ainda estiver muito grande, força o ajuste
      if (lines && lines.length > 0) {
        // Se tiver mais de 6 linhas, reduz drasticamente
        if (lines.length > 6) {
          fontSize = Math.max(14, fontSize - 15);
          ctx.font = `700 ${fontSize}px Arial, sans-serif`;
          lines = await this.wrapText(ctx, text, maxWidth);
        }
        
        // Posição Y inicial para o texto (ajustável)
        let startY = 75;
        let lineHeight = fontSize * 1.2;
        
        // Centraliza verticalmente se houver muitas linhas
        if (lines.length > 3) {
          startY = 70 - (lines.length - 3) * 5;
        }
        
        // Desenha cada linha
        lines.forEach((line, index) => {
          ctx.fillText(line, 15, startY + (index * lineHeight));
        });
      }

      ctx.beginPath();
      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      
      return api.sendMessage(
        { attachment: fs.createReadStream(pathImg) },
        threadID,
        () => {
          if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
        },
        messageID
      );
      
    } catch (err) {
      console.error("Mark Error:", err);
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      return message.reply("❌ | Ocorreu um erro ao gerar a imagem. Tente novamente mais tarde.");
    }
  },
};
