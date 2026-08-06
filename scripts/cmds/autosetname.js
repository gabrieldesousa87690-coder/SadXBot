function checkShortCut(nickname, uid, userName) {
	/\{userName\}/gi.test(nickname) ? nickname = nickname.replace(/\{userName\}/gi, userName) : null;
	/\{userID\}/gi.test(uid) ? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
	return nickname;
}

module.exports = {
	config: {
		name: "autosetname",
		version: "1.3",
		author: "Gerson",
		cooldowns: 5,
		role: 1,
		description: {
			pt: "Altera automaticamente o apelido de novos membros no grupo"
		},
		category: "box chat",
		guide: {
			pt: '   {pn} set <apelido>: usado para configurar o apelido automático, com os seguintes atalhos:'
				+ '\n   + {userName}: nome do membro que entrou no grupo'
				+ '\n   + {userID}: ID do membro'
				+ '\n   Exemplo:'
				+ '\n    {pn} set {userName} 🚀'
				+ '\n\n   {pn} [on | off]: usado para ativar/desativar este recurso'
				+ '\n\n   {pn} [view | info]: mostra a configuração atual'
		}
	},

	langs: {
		pt: {
			missingConfig: "Por favor, insira a configuração necessária",
			configSuccess: "Configuração definida com sucesso",
			currentConfig: "A configuração atual do autoSetName no seu grupo é:\n%1",
			notSetConfig: "Seu grupo ainda não configurou o autoSetName",
			syntaxError: "Erro de sintaxe, use apenas \"{pn} on\" ou \"{pn} off\"",
			turnOnSuccess: "Recurso autoSetName ativado com sucesso",
			turnOffSuccess: "Recurso autoSetName desativado com sucesso",
			error: "Ocorreu um erro ao usar o recurso autoSetName, tente desativar o recurso de link de convite no grupo e tente novamente"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		switch (args[0]) {
			case "set":
			case "add":
			case "config": {
				if (args.length < 2)
					return message.reply(getLang("missingConfig"));
				const configAutoSetName = args.slice(1).join(" ");
				await threadsData.set(event.threadID, configAutoSetName, "data.autoSetName");
				return message.reply(getLang("configSuccess"));
			}
			case "view":
			case "info": {
				const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");
				return message.reply(configAutoSetName ? getLang("currentConfig", configAutoSetName) : getLang("notSetConfig"));
			}
			default: {
				const enableOrDisable = args[0];
				if (enableOrDisable !== "on" && enableOrDisable !== "off")
					return message.reply(getLang("syntaxError"));
				await threadsData.set(event.threadID, enableOrDisable === "on", "settings.enableAutoSetName");
				return message.reply(enableOrDisable == "on" ? getLang("turnOnSuccess") : getLang("turnOffSuccess"));
			}
		}
	},

	onEvent: async ({ message, event, api, threadsData, getLang }) => {
		if (event.logMessageType !== "log:subscribe")
			return;
		if (!await threadsData.get(event.threadID, "settings.enableAutoSetName"))
			return;
		const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");

		return async function () {
			const addedParticipants = [...event.logMessageData.addedParticipants];

			for (const user of addedParticipants) {
				const { userFbId: uid, fullName: userName } = user;
				try {
					await api.changeNickname(checkShortCut(configAutoSetName, uid, userName), event.threadID, uid);
				}
				catch (e) {
					return message.reply(getLang("error"));
				}
			}
		};
	}
};