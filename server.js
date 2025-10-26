// 1. Import des librairies
const express = require('express');
const http = require('http');
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// 2. Initialisation
const app = express();
const server = http.createServer(app);
const port = 3000;
const prisma = new PrismaClient();

// 3. Servir les fichiers statiques du dossier "public"
app.use(express.static('public'));

// Middleware pour parser le JSON
app.use(express.json());

// 4. Nouvelle route API pour récupérer les généraux
app.get('/api/generals', async (req, res) => {
  try {
    const generals = await prisma.general.findMany();
    res.json(generals);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des données." });
  }
});

// Nouvelle route API pour la structure de l'armée
app.get('/api/armee-francaise', (req, res) => {
  try {
    const armeePath = path.join(__dirname, 'armee-francaise.json');
    // On ne parse pas, on envoie directement le fichier qui est déjà du JSON valide
    res.sendFile(armeePath);
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier armee-francaise.json:", error);
    res.status(500).json({ error: "Erreur lors de la lecture du fichier armee-francaise.json." });
  }
});

// Nouvelle route API pour récupérer les grades depuis la base de données
app.get('/api/grades', async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: {
        ordre: 'asc', // On trie par ordre hiérarchique
      },
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des grades." });
  }
});

// Route pour créer un nouveau grade
app.post('/api/grades', async (req, res) => {
  try {
    const newGrade = await prisma.grade.create({
      data: req.body,
    });
    res.status(201).json(newGrade);
  } catch (error) {
    console.error("Erreur lors de la création du grade:", error);
    res.status(500).json({ error: "Erreur lors de la création du grade." });
  }
});

// Route pour mettre à jour un grade
app.put('/api/grades/:id', async (req, res) => {
  const { id } = req.params;
  const dataToUpdate = req.body;
  delete dataToUpdate.id; // On retire l'ID du corps de la requête pour éviter une erreur Prisma
  try {
    const updatedGrade = await prisma.grade.update({
      where: { id: parseInt(id, 10) },
      data: dataToUpdate,
    });
    res.json(updatedGrade);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du grade:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du grade." });
  }
});

// Route pour supprimer un grade
app.delete('/api/grades/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.grade.delete({
      where: { id: parseInt(id, 10) },
    });
    res.status(204).send(); // 204 No Content = Succès, sans contenu à retourner
  } catch (error) {
    console.error("Erreur lors de la suppression du grade:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du grade." });
  }
});

// 5. Démarrage du serveur
server.listen(port, () => {
  console.log(`🚀 Serveur démarré et écoutant sur http://localhost:${port}`);
});
