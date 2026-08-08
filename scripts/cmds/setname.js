async function checkShortCut(nickname, uid, usersData) {
	try {
		/\{userName\}/gi.test(nickname) ? nickname = nickname.replace(/\{userName\}/gi, await usersData.getName(uid)) : null;
		/\{userID\}/gi.test(nickname) ? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
		return nickname;
	}
	catch (e) {
		return nickname;
	}
}

module.exports = {
	config: {
		name: "setname",
		version: "1.5",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Alterar apelido de todos os membros do grupo ou membros marcados em um formato",
			en: "Change nickname of all members in chat or members tagged by a format"
		},
		category: "grupo",
		guide: {
			vi: {
				body: "   {pn} <apelido>: alterar seu próprio apelido"
					+ "\n   {pn} @marcações <apelido>: alterar apelido dos membros marcados"
					+ "\n   {pn} all <apelido>: alterar apelido de todos os membros do grupo"
					+ "\n\nAtalhos disponíveis:"
					+ "\n   + {userName}: nome do membro"
					+ "\n   + {userID}: ID do membro"
					+ "\n\nExemplo: (veja a imagem)",
				attachment: {
					[`${__dirname}/assets/guide/setname_1.png`]: "https://i.ibb.co/gFh23zb/guide1.png",
					[`${__dirname}/assets/guide/setname_2.png`]: "https://i.ibb.co/BNWHKgj/guide2.png"
				}
			},
			en: {
				body: "   {pn} <nick name>: change nickname of yourself"
					+ "\n   {pn} @tags <nick name>: change nickname of members tagged"
					+ "\n   {pn} all <nick name>: change nickname of all members in chat"
					+ "\n\nWith available shortcuts:"
					+ "\n   + {userName}: name of member"
					+ "\n   + {userID}: ID of member"
					+ "\n\n   Example: (see image)",
				attachment: {
					[`${__dirname}/assets/guide/setname_1.png`]: "https://i.ibb.co/gFh23zb/guide1.png",
					[`${__dirname}/assets/guide/setname_2.png`]: "https://i.ibb.co/BNWHKgj/guide2.png"
				}
			}
		}
	},

	langs: {
		vi: {
			error: "Ocorreu um erro, tente desativar o recurso de link de convite no grupo e tente novamente"
		},
		en: {
			error: "An error has occurred, try turning off the invite link feature in the group and try again later"
		}
	},

	onStart: async function ({ args, message, event, api, usersData, getLang }) {
		const mentions = Object.keys(event.mentions);
		let uids = [];
		let nickname = args.join(" ");

		if (args[0] === "all" || mentions.includes(event.threadID)) {
			uids = (await api.getThreadInfo(event.threadID)).participantIDs;
			nickname = args[0] === "all" ? args.slice(1).join(" ") : nickname.replace(event.mentions[event.threadID], "").trim();
		}
		else if (mentions.length) {
			uids = mentions;
			const allName = new RegExp(
				Object.values(event.mentions)
					.map(name => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")) // fix error when name has special characters
					.join("|")
				, "g"
			);
			nickname = nickname.replace(allName, "").trim();
		}
		else {
			uids = [event.senderID];
			nickname = nickname.trim();
		}

		try {
			const uid = uids.shift();
			await api.changeNickname(await checkShortCut(nickname, uid, usersData), event.threadID, uid);
		}
		catch (e) {
			return message.reply(getLang("error"));
		}

		for (const uid of uids)
			await api.changeNickname(await checkShortCut(nickname, uid, usersData), event.threadID, uid);
	}
};