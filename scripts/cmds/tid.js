module.exports = {
        config: {
                name: "tid",
                version: "1.2",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        pt: "Veja o ID do seu grupo"
                },
                category: "info",
                guide: {
                        pt: "{pn}"
                }
        },

        onStart: async function ({ message, event }) {
                message.reply(event.threadID.toString());
        }
};