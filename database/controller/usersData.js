// usersData.js
// Gerenciador simples do banco de dados de usuários (JSON)

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../data/usersData.json');

function ensureDataFile() {
  const dir = path.dirname(dataFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
}

module.exports = {
  getAll() {
    ensureDataFile();
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  },

  saveAll(users) {
    ensureDataFile();
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
  },

  addUser(user) {
    const users = module.exports.getAll();
    users.push(user);
    module.exports.saveAll(users);
  },

  findById(id) {
    const users = module.exports.getAll();
    return users.find(u => u.id === id) || null;
  }
};
