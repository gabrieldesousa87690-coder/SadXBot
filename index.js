// index.js
// Ponto de entrada do bot (exemplo básico)

const SadX = require('./SadX');
const bot = new SadX('SadXBot');

console.log('Iniciando SadXBot...');
bot.logSadMessage();

// Exemplo de uso do login
const { login } = require('./bot/login/login');
login().then(() => console.log('Login (simulado) concluído')).catch(console.error);
