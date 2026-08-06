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
            pt: "   {pn} <texto>: Traduz texto para o idioma do grupo ou padrão do bot\n"
                + "   {pn} <texto> -> <ISO 639-1>: Traduz para o idioma desejado\n"
                + "   Ou responda a uma mensagem para traduzir o conteúdo\n"
                + "   Exemplos:\n"
                + "    {pn} hello -> pt\n"
                + "   {pn} -r [on | off]: Ativa/desativa tradução automática por reação\n"
                + "   {pn} -r set <emoji>: Define o emoji para traduzir mensagens"
        }
    },

    onStart: async function ({ message, event, args, threadsData, commandName }) {
        // Configuração de reação
        if (["-r", "-react", "-reaction"].includes(args[0])) {
            if (args[1] == "set") {
                return message.reply("🌀 Reaja a esta mensagem para definir o emoji de tradução", (err, info) =>
                    global.GoatBot.onReaction.set(info.messageID, {
                        type: "setEmoji",
                        commandName,
                        messageID: info.messageID,
                        authorID: event.senderID
                    })
                );
            }
            
            const isEnable = args[1] == "on" ? true : args[1] == "off" ? false : null;
            if (isEnable == null)
                return message.reply("❌ Escolha on ou off");
            
            await threadsData.set(event.threadID, isEnable, "data.translate.autoTranslateWhenReaction");
            return message.reply(
                isEnable 
                    ? `✅ Tradução por reação ativada! Reaja com "${defaultEmojiTranslate}" em qualquer mensagem para traduzir`
                    : "✅ Tradução por reação desativada!"
            );
        }

        const { body = "" } = event;
        let content;
        let langCodeTrans;
        const langOfThread = await threadsData.get(event.threadID, "data.lang") || "pt";

        // Responde a mensagem
        if (event.messageReply) {
            content = event.messageReply.body;
            let lastIndexSeparator = body.lastIndexOf("->");
            if (lastIndexSeparator == -1)
                lastIndexSeparator = body.lastIndexOf("=>");

            if (lastIndexSeparator != -1 && (body.length - lastIndexSeparator == 4 || body.length - lastIndexSeparator == 5))
                langCodeTrans = body.slice(lastIndexSeparator + 2);
            else if ((args[0] || "").match(/\w{2,3}/))
                langCodeTrans = args[0].match(/\w{2,3}/)[0];
            else
                langCodeTrans = langOfThread;
        }
        else {
            content = event.body;
            let lastIndexSeparator = content.lastIndexOf("->");
            if (lastIndexSeparator == -1)
                lastIndexSeparator = content.lastIndexOf("=>");

            if (lastIndexSeparator != -1 && (content.length - lastIndexSeparator == 4 || content.length - lastIndexSeparator == 5)) {
                langCodeTrans = content.slice(lastIndexSeparator + 2);
                content = content.slice(content.indexOf(args[0]), lastIndexSeparator);
            }
            else
                langCodeTrans = langOfThread;
        }

        if (!content)
            return message.SyntaxError();
        
        translateAndSendMessage(content, langCodeTrans, message);
    },

    onChat: async ({ event, threadsData }) => {
        if (!await threadsData.get(event.threadID, "data.translate.autoTranslateWhenReaction"))
            return;
        
        global.GoatBot.onReaction.set(event.messageID, {
            commandName: 'translate',
            messageID: event.messageID,
            body: event.body,
            type: "translate"
        });
    },

    onReaction: async ({ message, Reaction, event, threadsData }) => {
        switch (Reaction.type) {
            case "setEmoji": {
                if (event.userID != Reaction.authorID)
                    return;
                
                const emoji = event.reaction;
                if (!emoji)
                    return;
                
                await threadsData.set(event.threadID, emoji, "data.translate.emojiTranslate");
                return message.reply(`✅ Emoji de tradução definido para ${emoji}`, () => message.unsend(Reaction.messageID));
            }
            case "translate": {
                const emojiTrans = await threadsData.get(event.threadID, "data.translate.emojiTranslate") || "🌐";
                if (event.reaction == emojiTrans) {
                    const langCodeTrans = await threadsData.get(event.threadID, "data.lang") || "pt";
                    const content = Reaction.body;
                    Reaction.delete();
                    translateAndSendMessage(content, langCodeTrans, message);
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

async function translateAndSendMessage(content, langCodeTrans, message) {
    const { text, lang } = await translate(content.trim(), langCodeTrans.trim());
    return message.reply(`📝 ${text}\n\n🌐 Traduzido de ${lang} para ${langCodeTrans}`);
}
