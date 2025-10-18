// 1. Import des librairies
const express = require('express');
const http = require('http');
const fetch = require('node-fetch'); // Utiliser node-fetch
const { PrismaClient } = require('@prisma/client');

// 2. Initialisation
const app = express();
const server = http.createServer(app);
const port = 3000;
const prisma = new PrismaClient();

// 3. Servir les fichiers statiques du dossier "public"
app.use(express.static('public'));

// 4. Nouvelle route API pour récupérer les généraux
app.get('/api/generals', async (req, res) => {
  try {
    const generals = await prisma.general.findMany();
    res.json(generals);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des données." });
  }
});

// 5. Démarrage du serveur
server.listen(port, () => {
  console.log(`🚀 Serveur démarré et écoutant sur http://localhost:${port}`);
});
