const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');

const baseApiUrl = async () => {
        const base = await axios.get(`https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json`);
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "song",
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Baixe músicas/áudio do YouTube"
                },
                category: "music",
                guide: {
                        pt: '   {pn} [nome da música ou link]\n   Exemplo: {pn} stay justin bieber'
                }
        },

        langs: {
                pt: {
                        error: "❌ | Ocorreu um erro: %1",
                        noResult: "⭕ | Nenhum resultado encontrado para a palavra-chave %1",
                        choose: "Resultados das músicas:\n\n%1\nResponda com um número para baixar.",
                        success: "✅ | Baixado com sucesso: %1"
                }
        },

        onStart: async function ({ api, args, message, event, commandName, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68); 
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { threadID, messageID, senderID } = event;
                const input = args.join(" ");

                if (!input) return api.sendMessage("• Por favor, forneça o nome da música ou envie um link.", threadID, messageID);

                const apiUrl = await baseApiUrl();
                const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;

                if (checkurl.test(input)) {
                        const videoID = input.match(checkurl)[1];
                        api.setMessageReaction("⌛", messageID, () => {}, true);
                        return handleDownload(api, threadID, messageID, videoID, apiUrl, getLang);
                }

                try {
                        api.setMessageReaction("⏳", messageID, () => {}, true);
                        const res = await axios.get(`${apiUrl}/api/ytb/search?q=${encodeURIComponent(input)}`);
                        const results = res.data.results.slice(0, 6);
                        
                        if (!results || results.length === 0) return api.sendMessage(getLang("noResult", input), threadID, messageID);

                        let msg = "";
                        const attachments = [];
                        const cacheDir = path.join(__dirname, 'cache');
                        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                        for (let i = 0; i < results.length; i++) {
                                msg += `${i + 1}. ${results[i].title}\nTempo: ${results[i].time}\n\n`;
                                const thumbPath = path.join(cacheDir, `thumb_${senderID}_${Date.now()}_${i}.jpg`);
                                const thumbRes = await axios.get(results[i].thumbnail, { responseType: 'arraybuffer' });
                                fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
                                attachments.push(fs.createReadStream(thumbPath));
                        }

                        return api.sendMessage({
                                body: getLang("choose", msg),
                                attachment: attachments
                        }, threadID, (err, info) => {
                                attachments.forEach(stream => { if (fs.existsSync(stream.path)) fs.unlinkSync(stream.path); });
                                global.GoatBot.onReply.set(info.messageID, { 
                                        commandName, 
                                        author: senderID, 
                                        results, 
                                        apiUrl 
                                });
                        }, messageID);

                } catch (e) {
                        return api.sendMessage(getLang("error", e.message), threadID, messageID);
                }
        },

        onReply: async function ({ event, api, Reply, getLang }) {
                const { results, apiUrl, author } = Reply;
                if (event.senderID !== author) return;
                
                const choice = parseInt(event.body);
                if (isNaN(choice) || choice <= 0 || choice > results.length) return;
                
                const videoID = results[choice - 1].id;
                api.unsendMessage(Reply.messageID);
                api.setMessageReaction("⌛", event.messageID, () => {}, true);
               
                await handleDownload(api, event.threadID, event.messageID, videoID, apiUrl, getLang);
        }
};

async function handleDownload(api, threadID, messageID, videoID, apiUrl, getLang) {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const filePath = path.join(cacheDir, `music_${Date.now()}.mp3`);

        try {
                const res = await axios.get(`${apiUrl}/api/ytb/get?id=${videoID}&type=audio`);
                const { title, downloadLink } = res.data.data;
                
                const response = await axios({ url: downloadLink, method: 'GET', responseType: 'stream' });
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);

                writer.on('finish', () => {
                        api.sendMessage({
                                body: getLang("success", title),
                                attachment: fs.createReadStream(filePath)
                        }, threadID, () => { 
                                api.setMessageReaction("✅", messageID, () => {}, true);
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
                        }, messageID);
                });
        } catch (e) {
                api.sendMessage(getLang("error", "Falha no download!"), threadID, messageID);
        }
}
