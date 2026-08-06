const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "daily",
		version: "1.2",
		author: "Gerson",
		countDown: 5,
		role: 0,
		description: {
			pt: "Receba presente diário"
		},
		category: "game",
		guide: {
			pt: "   {pn}: Receber presente diário"
				+ "\n   {pn} info: Ver informações do presente diário"
		},
		envConfig: {
			rewardFirstDay: {
				coin: 100,
				exp: 10
			}
		}
	},

	langs: {
		pt: {
			monday: "Segunda-feira",
			tuesday: "Terça-feira",
			wednesday: "Quarta-feira",
			thursday: "Quinta-feira",
			friday: "Sexta-feira",
			saturday: "Sábado",
			sunday: "Domingo",
			alreadyReceived: "Você já recebeu o presente de hoje",
			received: "Você recebeu %1 moedas e %2 de experiência"
		}
	},

	onStart: async function ({ args, message, event, envCommands, usersData, commandName, getLang }) {
		const reward = envCommands[commandName].rewardFirstDay;
		if (args[0] == "info") {
			let msg = "";
			for (let i = 1; i < 8; i++) {
				const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((i == 0 ? 7 : i) - 1));
				const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((i == 0 ? 7 : i) - 1));
				const day = i == 7 ? getLang("sunday") :
					i == 6 ? getLang("saturday") :
						i == 5 ? getLang("friday") :
							i == 4 ? getLang("thursday") :
								i == 3 ? getLang("wednesday") :
									i == 2 ? getLang("tuesday") :
										getLang("monday");
				msg += `${day}: ${getCoin} moedas, ${getExp} de experiência\n`;
			}
			return message.reply(msg);
		}

		const dateTime = moment.tz("America/Sao_Paulo").format("DD/MM/YYYY");
		const date = new Date();
		const currentDay = date.getDay(); // 0: domingo, 1: segunda, 2: terça, 3: quarta, 4: quinta, 5: sexta, 6: sábado
		const { senderID } = event;

		const userData = await usersData.get(senderID);
		if (userData.data.lastTimeGetReward === dateTime)
			return message.reply(getLang("alreadyReceived"));

		const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((currentDay == 0 ? 7 : currentDay) - 1));
		const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((currentDay == 0 ? 7 : currentDay) - 1));
		userData.data.lastTimeGetReward = dateTime;
		await usersData.set(senderID, {
			money: userData.money + getCoin,
			exp: userData.exp + getExp,
			data: userData.data
		});
		message.reply(getLang("received", getCoin, getExp));
	}
};