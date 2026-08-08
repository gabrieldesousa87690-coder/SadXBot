const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "help",
    version: "1.0",
    author: "Bot",
    countDown: 5,
    role: 0,
    description: "Lista todos os comandos disponíveis",
    category: "info",
    guide: "{pn}: Mostra todos os comandos"
  },

  onStart: async function ({ message }) {
    const cmdsDir = path.join(__dirname);
    const files = fs.readdirSync(cmdsDir).filter(file => file.endsWith(".js") && file !== "help.js");

    let commandList = [];

    for (const file of files) {
      const filePath = path.join(cmdsDir, file);
      const command = require(filePath);

      if (!command.config || !command.config.name) continue;

      const name = command.config.name;
      const aliases = command.config.aliases || [];
      const description = command.config.description || "Sem descrição";
      const category = command.config.category || "sem categoria";

      commandList.push({ name, aliases, description, category });
    }

    // Agrupar por categoria
    const categorized = {};
    for (const cmd of commandList) {
      if (!categorized[cmd.category]) categorized[cmd.category] = [];
      categorized[cmd.category].push(cmd);
    }

    let msg = `📚 LISTA DE COMANDOS\n`;
    msg += `Total: ${commandList.length} comandos\n\n`;

    for (const [category, cmds] of Object.entries(categorized)) {
      msg += `📁 ${category.toUpperCase()}\n`;
      for (const cmd of cmds) {
        const aliasStr = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : "";
        msg += `  • ${cmd.name}${aliasStr}: ${cmd.description}\n`;
      }
      msg += `\n`;
    }

    return message.reply(msg);
  }
};