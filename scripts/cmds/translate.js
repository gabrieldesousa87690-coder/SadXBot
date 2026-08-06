const axios = require('axios');
const defaultEmojiTranslate = "🌐";

module.exports = {
    config: {
        name: "translate",
        aliases: ["trans", "traduzir", "tradutor"],
        version: "1.0",
        author: "SadX",
        countDown: 5,
        role: 0,
        description: {
            pt: "Traduza texto para o idioma desejado"
        },
        category: "utilidade",
        guide: {
            pt: "   {pn} <texto>: Traduz texto para o idioma do grupo\n"
                + "   {pn} <texto> -> <ISO 639-1>: Traduz para o idioma desejado\n"
                + "   Ou responda a uma mensagem para traduzir\n"
                + "   Exemplo: {pn} hello -> pt"
        }
    },

    onStart: async function ({ api, event, args, threadsData, commandName }) {
        const { threadID, messageID, senderID, body, messageReply } = event;

        // Configuração de reação
        if (["-r", "-react", "-reaction"].includes(args[0])) {
            if (args[1] == "set") {
                return api.sendMessage("🌀 Reaja a esta mensagem para definir o emoji de tradução", threadID, (err, info) => {
                    global.GoatBot.onReaction.set(info.messageID, {
                        type: "setEmoji",
                        commandName,
                        messageID: info.messageID,
                        authorID: senderID
                    });
                }, messageID);
            }

            const isEnable = args[1] == "on" ? true : args[1] == "off" ? false : null;
            if (isEnable == null) {
                return api.sendMessage("❌ Escolha on ou off", threadID, messageID);
            }

            await threadsData.set(threadID, isEnable, "data.translate.autoTranslateWhenReaction");
            return api.sendMessage(
                isEnable
                    ? `✅ Tradução por reação ativada! Reaja com "${defaultEmojiTranslate}" em qualquer mensagem para traduzir`
                    : "✅ Tradução por reação desativada!",
                threadID,
                messageID
            );
        }

        let content;
        let langCodeTrans;
        const langOfThread = await threadsData.get(threadID, "data.lang") || "pt";

        if (messageReply) {
            content = messageReply.body;
            const lastIndexSeparator = body.lastIndexOf("->") !== -1 ? body.lastIndexOf("->") : body.lastIndexOf("=>");

            if (lastIndexSeparator !== -1 && (body.length - lastIndexSeparator === 4 || body.length - lastIndexSeparator === 5)) {
                langCodeTrans = body.slice(lastIndexSeparator + 2);
            } else if ((args[0] || "").match(/\w{2,3}/)) {
                langCodeTrans = args[0].match(/\w{2,3}/)[0];
            } else {
                langCodeTrans = langOfThread;
            }
        } else {
            content = body;
            const lastIndexSeparator = content.lastIndexOf("->") !== -1 ? content.lastIndexOf("->") : content.lastIndexOf("=>");

            if (lastIndexSeparator !== -1 && (content.length - lastIndexSeparator === 4 || content.length - lastIndexSeparator === 5)) {
                langCodeTrans = content.slice(lastIndexSeparator + 2);
                content = content.slice(content.indexOf(args[0]), lastIndexSeparator);
            } else {
                langCodeTrans = langOfThread;
            }
        }

        if (!content) {
            return api.sendMessage(`❌ Uso correto: !translate <texto> ou !translate <texto> -> pt`, threadID, messageID);
        }

        translateAndSendMessage(content, langCodeTrans, api, threadID, messageID);
    },

    onChat: async ({ api, event, threadsData }) => {
        if (!await threadsData.get(event.threadID, "data.translate.autoTranslateWhenReaction")) return;

        global.GoatBot.onReaction.set(event.messageID, {
            commandName: 'translate',
            messageID: event.messageID,
            body: event.body,
            type: "translate"
        });
    },

    onReaction: async ({ api, event, Reaction, threadsData }) => {
        const { threadID, messageID, userID, reaction } = event;

        switch (Reaction.type) {
            case "setEmoji": {
                if (userID != Reaction.authorID) return;

                const emoji = reaction;
                if (!emoji) return;

                await threadsData.set(threadID, emoji, "data.translate.emojiTranslate");
                return api.sendMessage(`✅ Emoji de tradução definido para ${emoji}`, threadID, () => {
                    api.unsendMessage(Reaction.messageID);
                }, messageID);
            }
            case "translate": {
                const emojiTrans = await threadsData.get(threadID, "data.translate.emojiTranslate") || "🌐";
                if (reaction == emojiTrans) {
                    const langCodeTrans = await threadsData.get(threadID, "data.lang") || "pt";
                    const content = Reaction.body;
                    Reaction.delete();
                    translateAndSendMessage(content, langCodeTrans, api, threadID, messageID);
                }
            }
        }
    }
};

async function translate(text, langCode) {
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`);
    return {
        text: res.data[0].map(item => item[0]).join(''),
        lang: res.data[2]
    };
}

async function translateAndSendMessage(content, langCodeTrans, api, threadID, messageID) {
    try {
        const { text, lang } = await translate(content.trim(), langCodeTrans.trim());
        return api.sendMessage(`📝 ${text}\n\n🌐 Traduzido de ${lang} para ${langCodeTrans}`, threadID, messageID);
    } catch (error) {
        return api.sendMessage(`❌ Erro na tradução: ${error.message}`, threadID, messageID);
    }
}
