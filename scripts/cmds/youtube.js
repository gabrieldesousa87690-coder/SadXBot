const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');

const baseApiUrl = async () => {
    const base = await axios.get(`https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json`);
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "ytb",
        aliases: ["youtube", "yt"],
        version: "2.7",
        author: "gerson",
        countDown: 10,
        role: 0,
        description: {
            pt: "Baixe vídeo, áudio ou veja informações de vídeos no YouTube"
        },
        category: "media",
        guide: {
            pt: "   {pn} [video|-v] [<nome do vídeo>|<link do vídeo>]: baixar vídeo do YouTube\n"
                + "   {pn} [audio|-a] [<nome do vídeo>|<link do vídeo>]: baixar áudio do YouTube\n"
                + "   {pn} [info|-i] [<nome do vídeo>|<link do vídeo>]: ver informações do vídeo\n"
                + "   Exemplos:\n"
                + "    {pn} -v Música Relaxante\n"
                + "    {pn} -a Música Relaxante\n"
                + "    {pn} -i Música Relaxante"
        }
    },

    onStart: async function ({ api, args, message, event, commandName }) {
        const { threadID, messageID, senderID } = event;

        let type;
        switch (args[0]) {
            case "-v":
            case "video":
                type = "video";
                break;
            case "-a":
            case "-s":
            case "audio":
            case "sing":
                type = "audio";
                break;
            case "-i":
            case "info":
                type = "info";
                break;
            default:
                return message.SyntaxError();
        }

        const input = args.slice(1).join(" ");
        if (!input) return message.SyntaxError();

        const apiUrl = await baseApiUrl();
        const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;

        if (checkurl.test(input)) {
            const videoID = input.match(checkurl)[1];
            api.setMessageReaction("🌸", messageID, () => { }, true);
            if (type === 'info') return fetchInfo(api, threadID, messageID, videoID, apiUrl);
            return handleDownload(api, threadID, messageID, videoID, type, apiUrl);
        }

        try {
            api.setMessageReaction("🌸", messageID, () => { }, true);
            const res = await axios.get(`${apiUrl}/api/ytb/search?q=${encodeURIComponent(input)}`);
            const results = res.data.results.slice(0, 6);
            if (!results || results.length === 0) {
                return api.sendMessage(`💔🌸 baby, nenhum resultado encontrado para "${input}"`, threadID, messageID);
            }

            let msg = "";
            const attachments = [];
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            for (let i = 0; i < results.length; i++) {
                msg += `${i + 1}. ${results[i].title}\n⏱ Tempo: ${results[i].time}\n📺 Canal: ${results[i].channel.name || results[i].channel}\n\n`;
                const thumbPath = path.join(cacheDir, `thumb_${senderID}_${Date.now()}_${i}.jpg`);
                const thumbRes = await axios.get(results[i].thumbnail, { responseType: 'arraybuffer' });
                fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
                attachments.push(fs.createReadStream(thumbPath));
            }

            return api.sendMessage({
                body: `📋 Escolha um número:\n\n${msg}`,
                attachment: attachments
            }, threadID, (err, info) => {
                attachments.forEach(stream => { if (fs.existsSync(stream.path)) fs.unlinkSync(stream.path); });
                global.GoatBot.onReply.set(info.messageID, {
                    commandName,
                    author: senderID,
                    results,
                    type,
                    apiUrl,
                    menuMessageID: info.messageID
                });
            }, messageID);

        } catch (e) {
            return api.sendMessage(`❌ Erro na API: ${e.message}`, threadID, messageID);
        }
    },

    onReply: async function ({ event, api, Reply }) {
        const { results, type, apiUrl, author, menuMessageID } = Reply;
        if (event.senderID !== author) return;

        const targetMessageID = menuMessageID || Reply.messageID;

        const choice = parseInt(event.body);
        if (isNaN(choice) || choice <= 0 || choice > results.length) {
            return api.unsendMessage(targetMessageID);
        }

        const videoID = results[choice - 1].id;

        api.unsendMessage(targetMessageID);
        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        if (type === 'info') return fetchInfo(api, event.threadID, event.messageID, videoID, apiUrl);
        await handleDownload(api, event.threadID, event.messageID, videoID, type, apiUrl);
    }
};

async function handleDownload(api, threadID, messageID, videoID, type, apiUrl) {
    const format = type === 'audio' ? 'mp3' : 'mp4';
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `yt_${Date.now()}.${format}`);

    try {
        const res = await axios.get(`${apiUrl}/api/ytb/get?id=${videoID}&type=${type}`);
        const { title, downloadLink } = res.data.data;

        const tipo = type === 'audio' ? 'áudio' : 'vídeo';
        api.sendMessage(`⬇️ Baixando ${tipo} "${title}"...`, threadID, messageID);

        const response = await axios({ url: downloadLink, method: 'GET', responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: `📹 ${title}`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                api.setMessageReaction("💜", messageID, () => { }, true);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, messageID);
        });

        writer.on('error', (err) => {
            throw err;
        });
    } catch (e) {
        api.sendMessage(`❌ Desculpa baby, erro ao baixar: ${e.message}`, threadID, messageID);
    }
}

async function fetchInfo(api, threadID, messageID, videoID, apiUrl) {
    try {
        const res = await axios.get(`${apiUrl}/api/ytb/details?id=${videoID}`);
        const d = res.data.details;

        const formatNum = (num) => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        const msg =
            `💠 Título: ${d.title}\n` +
            `🏪 Canal: ${d.channel}\n` +
            `👨‍👩‍👧‍👦 Inscritos: ${formatNum(d.subCount || 0)}\n` +
            `⏱ Duração: ${d.duration_raw || d.duration}\n` +
            `👀 Visualizações: ${formatNum(d.view_count || 0)}\n` +
            `👍 Curtidas: ${formatNum(d.like_count || 0)}\n` +
            `🆙 Data: ${d.upload_date || 'N/A'}\n` +
            `🔠 ID: ${videoID}\n` +
            `🔗 Link: ${d.webpage_url}`;

        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        const thumbPath = path.join(cacheDir, `info_${videoID}.jpg`);
        const thumbRes = await axios.get(d.thumbnail, { responseType: 'arraybuffer' });
        fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));

        api.sendMessage({ body: msg, attachment: fs.createReadStream(thumbPath) },
            threadID, () => {
                api.setMessageReaction("💜", messageID, () => { }, true);
                if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            }, messageID);
    } catch (e) {
        api.sendMessage(`❌ Erro ao buscar informações: ${e.message}`, threadID, messageID);
    }
}
