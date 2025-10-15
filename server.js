// 1. Import des librairies
const express = require('express');
const http = require('http');

// 2. Initialisation
const app = express();
const server = http.createServer(app);
const port = 3000;

// 3. Route de test
app.get('/', (req, res) => {
  res.send('<h1>Le serveur de votre jeu est en ligne !</h1>');
});

// 4. Démarrage du serveur
server.listen(port, () => {
  console.log(`🚀 Serveur démarré et écoutant sur http://localhost:${port}`);
});
