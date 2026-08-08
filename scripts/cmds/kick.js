module.exports = {
	config: {
		name: "kick",
		version: "1.3",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			vi: "Expulsar membro do grupo",
			en: "Kick member out of chat box"
		},
		category: "grupo",
		guide: {
			vi: "   {pn} @marcações: use para expulsar os membros marcados",
			en: "   {pn} @tags: use to kick members who are tagged"
		}
	},

	langs: {
		vi: {
			needAdmin: "Por favor, adicione administrador para o bot antes de usar este recurso"
		},
		en: {
			needAdmin: "Please add admin for bot before using this feature"
		}
	},

	onStart: async function ({ message, event, args, threadsData, api, getLang }) {
		const adminIDs = await threadsData.get(event.threadID, "adminIDs");
		if (!adminIDs.includes(api.getCurrentUserID()))
			return message.reply(getLang("needAdmin"));
		async function kickAndCheckError(uid) {
			try {
				await api.removeUserFromGroup(uid, event.threadID);
			}
			catch (e) {
				message.reply(getLang("needAdmin"));
				return "ERROR";
			}
		}
		if (!args[0]) {
			if (!event.messageReply)
				return message.SyntaxError();
			await kickAndCheckError(event.messageReply.senderID);
		}
		else {
			const uids = Object.keys(event.mentions);
			if (uids.length === 0)
				return message.SyntaxError();
			if (await kickAndCheckError(uids.shift()) === "ERROR")
				return;
			for (const uid of uids)
				api.removeUserFromGroup(uid, event.threadID);
		}
	}
};