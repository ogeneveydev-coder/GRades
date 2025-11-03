// 1. Import des librairies
const express = require('express');
const http = require('http');
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const os = require('os');
const session = require('express-session');
const bcrypt = require('bcrypt');

// 2. Initialisation
const app = express();
const server = http.createServer(app);
const port = 3000;
const prisma = new PrismaClient();

// --- Middlewares ---

// Servir les fichiers statiques du dossier "public"
app.use(express.static('public'));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Pour les formulaires HTML

// Middleware pour les sessions
app.use(
  session({
    // Idéalement, ce secret devrait être dans votre fichier .env
    secret: 'un-secret-tres-long-et-aleatoire-pour-la-securite',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Mettre à true si vous passez en HTTPS
      sameSite: 'lax', // Important pour que le cookie soit envoyé
      maxAge: 24 * 60 * 60 * 1000, // La session dure 24 heures
    },
  })
);

// Middleware pour vérifier si l'utilisateur est authentifié
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Accès non autorisé. Vous devez être connecté.' });
};

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

// --- Routes d'authentification ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe sont requis.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        // On crée un personnage par défaut pour le nouvel utilisateur
        personnage: { create: {} }
      },
    });
    res.status(201).json({ message: 'Utilisateur créé avec succès.', userId: user.id });
  } catch (error) {
    if (error.code === 'P2002') { // Erreur de contrainte unique (email déjà pris)
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ error: "Erreur lors de la création de l'utilisateur." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user.id; // Stocke l'ID de l'utilisateur dans la session
    res.json({ message: 'Connexion réussie.' });
  } else {
    res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Impossible de se déconnecter.' });
    }
    res.clearCookie('connect.sid'); // Nom du cookie par défaut pour express-session
    res.json({ message: 'Déconnexion réussie.' });
  });
});

app.get('/api/auth/status', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
      if (user) {
        res.json({ loggedIn: true, email: user.email });
      } else {
        req.session.destroy();
        res.json({ loggedIn: false });
      }
    } catch (error) {
      res.status(500).json({ loggedIn: false, error: 'Erreur serveur' });
    }
  } else {
    res.json({ loggedIn: false });
  }
});

// Route pour récupérer le personnage de l'utilisateur connecté
app.get('/api/me/personnage', isAuthenticated, async (req, res) => {
  try {
    let personnage = await prisma.personnage.findUnique({
      where: {
        userId: req.session.userId,
      },
    });

    // Si aucun personnage n'est trouvé, on en crée un pour l'utilisateur
    if (!personnage) {
      console.log(`Aucun personnage trouvé pour l'utilisateur ID ${req.session.userId}. Création d'un nouveau personnage.`);
      personnage = await prisma.personnage.create({ data: { userId: req.session.userId } });
    }

    if (!personnage) {
      return res.status(404).json({ error: 'Personnage non trouvé pour cet utilisateur.' });
    }

    // On cherche les détails du grade pour récupérer le pictogramme
    const gradeDetails = await prisma.grade.findUnique({
      where: { nom: personnage.grade },
    });

    // On combine les informations du personnage avec le pictogramme de son grade
    const personnageComplet = {
      ...personnage,
      pictogramme: gradeDetails?.pictogramme || null,
    };

    res.json(personnageComplet);
  } catch (error) {
    console.error("Erreur lors de la récupération du personnage:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du personnage." });
  }
});

// Route pour récupérer tous les utilisateurs
app.get('/api/users', isAuthenticated, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        personnage: true, // Inclure les données du personnage associé
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs." });
  }
});

// Route pour créer un nouveau grade
app.post('/api/grades', isAuthenticated, async (req, res) => {
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
app.put('/api/grades/:id', isAuthenticated, async (req, res) => {
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
app.delete('/api/grades/:id', isAuthenticated, async (req, res) => {
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
server.listen(port, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`🚀 Serveur démarré.`);
  console.log(`   - Sur votre ordinateur : http://localhost:${port}`);
  console.log(`   - Sur votre réseau local : http://${ip}:${port}`);
});

function getLocalIp() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '0.0.0.0';
}
