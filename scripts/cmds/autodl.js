const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud69;
};

module.exports = {
    config: {
        name: "autodl",
        aliases: ["autobaixar", "dl"],
        version: "1.0",
        author: "SadX",
        countDown: 0,
        role: 0,
        description: {
            pt: "Baixa vídeos automaticamente de várias plataformas"
        },
        category: "media",
        guide: {
            pt: "[link_do_video]\n\nPlataformas Suportadas:\n• TikTok\n• YouTube / Shorts\n• Facebook / FB Watch\n• Instagram / Reels\n• Twitter (X)\n• Threads\n• Snapchat\n• Pinterest\n• Spotify\n• SoundCloud\n• Reddit\n• LinkedIn\n• CapCut\n• Dailymotion\n• Kwai / Kuaishou\n• Douyin\n• Bluesky\n• Tumblr"
        }
    },

    onStart: async function () { },

    onChat: async function ({ api, event }) {
        let textInput = event.body ? event.body.trim() : "";

        try {
            const exactUrlMatch = textInput.match(/^https?:\/\/[^\s]+$/i);
            if (!exactUrlMatch) return;

            const url = exactUrlMatch[0];

            // Lista de plataformas suportadas
            const supportedPlatforms = [
                "tiktok.com", "youtube.com", "youtu.be",
                "twitter.com", "x.com",
                "facebook.com", "fb.watch",
                "instagram.com",
                "tumblr.com",
                "threads.net",
                "spotify.com",
                "soundcloud.com",
                "snapchat.com",
                "reddit.com",
                "pinterest.com", "pin.it",
                "linkedin.com",
                "kuaishou.com", "kwai.com",
                "douyin.com",
                "dailymotion.com", "dai.ly",
                "capcut.com",
                "bsky.app"
            ];

            const isSupported = supportedPlatforms.some(platform => url.includes(platform));

            if (isSupported) {
                api.setMessageReaction("🐤", event.messageID, (err) => { }, true);

                if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
                const filePath = __dirname + "/cache/video_baixado.mp4";

                const base = await baseApiUrl();
                const response = await axios.get(`${base}/api/download?url=${encodeURIComponent(url)}`);
                if (!response.data || !response.data.result) throw new Error("Falha ao obter URL do vídeo");

                const videoUrl = response.data.result;
                const videoData = (await axios.get(videoUrl, { responseType: "arraybuffer" })).data;
                fs.writeFileSync(filePath, Buffer.from(videoData, "binary"));

                api.setMessageReaction("🪽", event.messageID, (err) => { }, true);
                api.sendMessage(
                    {
                        body: response.data.cp || "📹 Vídeo baixado com sucesso!",
                        attachment: fs.createReadStream(filePath),
                    },
                    event.threadID,
                    () => {
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    },
                    event.messageID
                );
            }
        } catch (e) {
            console.error("AutoDL Error:", e.message);
            api.setMessageReaction("❎", event.messageID, (err) => { }, true);
        }
    },
};
