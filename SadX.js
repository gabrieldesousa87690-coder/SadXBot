// SadX.js
// Arquivo criado por GitHub Copilot sob solicitação do usuário.
// Implementação básica do módulo SadX.

class SadX {
  constructor(name = 'SadX') {
    this.name = name;
  }

  // Exemplo de método que retorna uma mensagem triste
  sadMessage() {
    return `${this.name} está se sentindo triste hoje... 😔`;
  }

  // Método demonstrativo para logar a mensagem
  logSadMessage() {
    console.log(this.sadMessage());
  }
}

module.exports = SadX;
