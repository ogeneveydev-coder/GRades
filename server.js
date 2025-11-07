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

// --- Redirection pour la racine ---
// Si l'utilisateur n'est pas connecté et essaie d'accéder à la racine,
// on le redirige vers la page de connexion.
app.get('/', (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login.html');
  }
  next(); // Si connecté, on laisse express.static servir index.html
});

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
  const { email, password, pseudo } = req.body;
  if (!email || !password || !pseudo) {
    return res.status(400).json({ error: 'Email, pseudo et mot de passe sont requis.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        pseudo,
        password: hashedPassword,
        // On crée un personnage par défaut pour le nouvel utilisateur
        personnage: { create: {} }
      },
    });
    res.status(201).json({ message: 'Utilisateur créé avec succès.', userId: user.id });
  } catch (error) {
    if (error.code === 'P2002') { // Erreur de contrainte unique
      if (error.meta?.target?.includes('email')) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
      }
      if (error.meta?.target?.includes('pseudo')) {
        return res.status(409).json({ error: 'Ce pseudo est déjà utilisé.' });
      }
      return res.status(409).json({ error: 'Email ou pseudo déjà utilisé.' });
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
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: { personnage: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    let personnage = user.personnage;

    // Si aucun personnage n'est trouvé, on en crée un pour l'utilisateur
    if (!personnage) {
      console.log(`Aucun personnage trouvé pour l'utilisateur ID ${req.session.userId}. Création d'un nouveau personnage.`);
      personnage = await prisma.personnage.create({ data: { userId: req.session.userId } });
    }

    // On cherche les détails du grade pour récupérer le pictogramme
    const gradeDetails = await prisma.grade.findUnique({
      where: { nom: personnage.grade },
    });

    // On combine les informations du personnage avec le pseudo et le pictogramme
    const personnageComplet = {
      ...personnage,
      pseudo: user.pseudo,
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

// Route pour récupérer la courbe d'XP
app.get('/api/xp-curve', isAuthenticated, async (req, res) => {
  try {
    const xpCurve = await prisma.levelXP.findMany({
      orderBy: {
        level: 'asc',
      },
    });
    res.json(xpCurve);
  } catch (error) {
    console.error("Erreur lors de la récupération de la courbe d'XP:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de la courbe d'XP." });
  }
});

// --- Routes pour la gestion des Objets (CRUD) ---

// GET /api/objects - Récupérer tous les objets
app.get('/api/objects', isAuthenticated, async (req, res) => {
  try {
    const objects = await prisma.objet.findMany({
      orderBy: { nom: 'asc' },
    });
    res.json(objects);
  } catch (error) {
    console.error("Erreur lors de la récupération des objets:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des objets." });
  }
});

// POST /api/objects - Créer un nouvel objet
app.post('/api/objects', isAuthenticated, async (req, res) => {
  try {
    // Convertir les valeurs numériques qui pourraient arriver en string
    const objectData = {
      ...req.body,
      poids: parseFloat(req.body.poids) || 0,
      degatsMin: req.body.degatsMin ? parseInt(req.body.degatsMin, 10) : null,
      degatsMax: req.body.degatsMax ? parseInt(req.body.degatsMax, 10) : null,
      valeurProtection: req.body.valeurProtection ? parseInt(req.body.valeurProtection, 10) : null,
      bonusSoldatForce: req.body.bonusSoldatForce ? parseInt(req.body.bonusSoldatForce, 10) : null,
      bonusSoldatConstitution: req.body.bonusSoldatConstitution ? parseInt(req.body.bonusSoldatConstitution, 10) : null,
      bonusSoldatDexterite: req.body.bonusSoldatDexterite ? parseInt(req.body.bonusSoldatDexterite, 10) : null,
      bonusSoldatCharisme: req.body.bonusSoldatCharisme ? parseInt(req.body.bonusSoldatCharisme, 10) : null,
      bonusSoldatIntelligence: req.body.bonusSoldatIntelligence ? parseInt(req.body.bonusSoldatIntelligence, 10) : null,
      bonusSoldatVitesse: req.body.bonusSoldatVitesse ? parseInt(req.body.bonusSoldatVitesse, 10) : null,
      bonusSoldatChance: req.body.bonusSoldatChance ? parseInt(req.body.bonusSoldatChance, 10) : null,
      bonusSoldatFidelite: req.body.bonusSoldatFidelite ? parseInt(req.body.bonusSoldatFidelite, 10) : null,
      bonusSoldatResistance: req.body.bonusSoldatResistance ? parseInt(req.body.bonusSoldatResistance, 10) : null,
      bonusSoldatPrecision: req.body.bonusSoldatPrecision ? parseInt(req.body.bonusSoldatPrecision, 10) : null,
      bonusSoldatTauxCritique: req.body.bonusSoldatTauxCritique ? parseInt(req.body.bonusSoldatTauxCritique, 10) : null,
      bonusSoldatDegatsCritiques: req.body.bonusSoldatDegatsCritiques ? parseInt(req.body.bonusSoldatDegatsCritiques, 10) : null,
      bonusSoldatPointsDeVie: req.body.bonusSoldatPointsDeVie ? parseInt(req.body.bonusSoldatPointsDeVie, 10) : null,
      bonusSoldatAttaque: req.body.bonusSoldatAttaque ? parseInt(req.body.bonusSoldatAttaque, 10) : null,
      bonusPersonnageForce: req.body.bonusPersonnageForce ? parseInt(req.body.bonusPersonnageForce, 10) : null,
      bonusPersonnageConstitution: req.body.bonusPersonnageConstitution ? parseInt(req.body.bonusPersonnageConstitution, 10) : null,
      bonusPersonnageDexterite: req.body.bonusPersonnageDexterite ? parseInt(req.body.bonusPersonnageDexterite, 10) : null,
      bonusPersonnageCharisme: req.body.bonusPersonnageCharisme ? parseInt(req.body.bonusPersonnageCharisme, 10) : null,
      bonusPersonnageIntelligence: req.body.bonusPersonnageIntelligence ? parseInt(req.body.bonusPersonnageIntelligence, 10) : null,
      bonusPersonnageVitesse: req.body.bonusPersonnageVitesse ? parseInt(req.body.bonusPersonnageVitesse, 10) : null,
      bonusPersonnageChance: req.body.bonusPersonnageChance ? parseInt(req.body.bonusPersonnageChance, 10) : null,
      bonusPersonnageFidelite: req.body.bonusPersonnageFidelite ? parseInt(req.body.bonusPersonnageFidelite, 10) : null,
      bonusPersonnageAmbition: req.body.bonusPersonnageAmbition ? parseInt(req.body.bonusPersonnageAmbition, 10) : null,
      bonusPersonnagePointsDeVie: req.body.bonusPersonnagePointsDeVie ? parseInt(req.body.bonusPersonnagePointsDeVie, 10) : null,
      bonusPersonnageAttaque: req.body.bonusPersonnageAttaque ? parseInt(req.body.bonusPersonnageAttaque, 10) : null,
    };
    const newObject = await prisma.objet.create({ data: objectData });
    res.status(201).json(newObject);
  } catch (error) {
    console.error("Erreur lors de la création de l'objet:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Un objet avec ce nom existe déjà.' });
    }
    res.status(500).json({ error: "Erreur lors de la création de l'objet." });
  }
});

// PUT /api/objects/:id - Mettre à jour un objet
app.put('/api/objects/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const dataToUpdate = req.body;
  // Assurez-vous que les types de données sont corrects avant la mise à jour
  if (dataToUpdate.poids) dataToUpdate.poids = parseFloat(dataToUpdate.poids);
  if (dataToUpdate.degatsMin) dataToUpdate.degatsMin = parseInt(dataToUpdate.degatsMin, 10);
  if (dataToUpdate.degatsMax) dataToUpdate.degatsMax = parseInt(dataToUpdate.degatsMax, 10);
  if (dataToUpdate.valeurProtection) dataToUpdate.valeurProtection = parseInt(dataToUpdate.valeurProtection, 10);
  if (dataToUpdate.bonusSoldatForce) dataToUpdate.bonusSoldatForce = parseInt(dataToUpdate.bonusSoldatForce, 10);
  if (dataToUpdate.bonusSoldatConstitution) dataToUpdate.bonusSoldatConstitution = parseInt(dataToUpdate.bonusSoldatConstitution, 10);
  if (dataToUpdate.bonusSoldatDexterite) dataToUpdate.bonusSoldatDexterite = parseInt(dataToUpdate.bonusSoldatDexterite, 10);
  if (dataToUpdate.bonusSoldatCharisme) dataToUpdate.bonusSoldatCharisme = parseInt(dataToUpdate.bonusSoldatCharisme, 10);
  if (dataToUpdate.bonusSoldatIntelligence) dataToUpdate.bonusSoldatIntelligence = parseInt(dataToUpdate.bonusSoldatIntelligence, 10);
  if (dataToUpdate.bonusSoldatVitesse) dataToUpdate.bonusSoldatVitesse = parseInt(dataToUpdate.bonusSoldatVitesse, 10);
  if (dataToUpdate.bonusSoldatChance) dataToUpdate.bonusSoldatChance = parseInt(dataToUpdate.bonusSoldatChance, 10);
  if (dataToUpdate.bonusSoldatFidelite) dataToUpdate.bonusSoldatFidelite = parseInt(dataToUpdate.bonusSoldatFidelite, 10);
  if (dataToUpdate.bonusSoldatResistance) dataToUpdate.bonusSoldatResistance = parseInt(dataToUpdate.bonusSoldatResistance, 10);
  if (dataToUpdate.bonusSoldatPrecision) dataToUpdate.bonusSoldatPrecision = parseInt(dataToUpdate.bonusSoldatPrecision, 10);
  if (dataToUpdate.bonusSoldatTauxCritique) dataToUpdate.bonusSoldatTauxCritique = parseInt(dataToUpdate.bonusSoldatTauxCritique, 10);
  if (dataToUpdate.bonusSoldatDegatsCritiques) dataToUpdate.bonusSoldatDegatsCritiques = parseInt(dataToUpdate.bonusSoldatDegatsCritiques, 10);
  if (dataToUpdate.bonusSoldatPointsDeVie) dataToUpdate.bonusSoldatPointsDeVie = parseInt(dataToUpdate.bonusSoldatPointsDeVie, 10);
  if (dataToUpdate.bonusSoldatAttaque) dataToUpdate.bonusSoldatAttaque = parseInt(dataToUpdate.bonusSoldatAttaque, 10);
  if (dataToUpdate.bonusPersonnageForce) dataToUpdate.bonusPersonnageForce = parseInt(dataToUpdate.bonusPersonnageForce, 10);
  if (dataToUpdate.bonusPersonnageConstitution) dataToUpdate.bonusPersonnageConstitution = parseInt(dataToUpdate.bonusPersonnageConstitution, 10);
  if (dataToUpdate.bonusPersonnageDexterite) dataToUpdate.bonusPersonnageDexterite = parseInt(dataToUpdate.bonusPersonnageDexterite, 10);
  if (dataToUpdate.bonusPersonnageCharisme) dataToUpdate.bonusPersonnageCharisme = parseInt(dataToUpdate.bonusPersonnageCharisme, 10);
  if (dataToUpdate.bonusPersonnageIntelligence) dataToUpdate.bonusPersonnageIntelligence = parseInt(dataToUpdate.bonusPersonnageIntelligence, 10);
  if (dataToUpdate.bonusPersonnageVitesse) dataToUpdate.bonusPersonnageVitesse = parseInt(dataToUpdate.bonusPersonnageVitesse, 10);
  if (dataToUpdate.bonusPersonnageChance) dataToUpdate.bonusPersonnageChance = parseInt(dataToUpdate.bonusPersonnageChance, 10);
  if (dataToUpdate.bonusPersonnageFidelite) dataToUpdate.bonusPersonnageFidelite = parseInt(dataToUpdate.bonusPersonnageFidelite, 10);
  if (dataToUpdate.bonusPersonnageAmbition) dataToUpdate.bonusPersonnageAmbition = parseInt(dataToUpdate.bonusPersonnageAmbition, 10);
  if (dataToUpdate.bonusPersonnagePointsDeVie) dataToUpdate.bonusPersonnagePointsDeVie = parseInt(dataToUpdate.bonusPersonnagePointsDeVie, 10);
  if (dataToUpdate.bonusPersonnageAttaque) dataToUpdate.bonusPersonnageAttaque = parseInt(dataToUpdate.bonusPersonnageAttaque, 10);

  try {
    const updatedObject = await prisma.objet.update({
      where: { id: parseInt(id, 10) },
      data: dataToUpdate,
    });
    res.json(updatedObject);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'objet ${id}:`, error);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'objet." });
  }
});

// DELETE /api/objects/:id - Supprimer un objet
app.delete('/api/objects/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.objet.delete({ where: { id: parseInt(id, 10) } });
    res.status(204).send();
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'objet ${id}:`, error);
    // Si l'objet est utilisé dans un inventaire, Prisma renverra une erreur (P2003)
    if (error.code === 'P2003') {
      return res.status(409).json({ error: "Impossible de supprimer cet objet car il est utilisé dans au moins un inventaire." });
    }
    res.status(500).json({ error: "Erreur lors de la suppression de l'objet." });
  }
});

// --- Route pour la visualisation de la BDD ---

app.get('/api/database/all', isAuthenticated, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        personnage: true,
      }
    });

    const soldats = await prisma.soldat.findMany({
      include: {
        inventaire: true,
      }
    });

    const objets = await prisma.objet.findMany();

    res.json({
      users,
      soldats,
      objets,
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des données de la BDD:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des données de la BDD." });
  }
});

// Route pour récupérer les données d'une table spécifique
app.get('/api/database/table/:tableName', isAuthenticated, async (req, res) => {
    const { tableName } = req.params;
    // Le client Prisma utilise le camelCase (ex: user, nomDeFamille)
    // On convertit le nom du modèle de PascalCase à camelCase.
    const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);

    try {
        // On vérifie que le modèle existe sur le client Prisma
        if (!prisma[modelName]) {
            return res.status(400).json({ error: `Modèle "${tableName}" non trouvé.` });
        }

        const data = await prisma[modelName].findMany();
        res.json(data);
    } catch (error) {
        console.error(`Erreur lors de la récupération des données de la table ${tableName}:`, error);
        res.status(500).json({ error: `Erreur lors de la récupération des données de la table ${tableName}.` });
    }
});





// Route pour récupérer le schéma Prisma
app.get('/api/database/schema', isAuthenticated, (req, res) => {
  try {
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    res.json({ schema: schemaContent });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier schema.prisma:", error);
    res.status(500).json({ error: "Impossible de lire le fichier de schéma." });
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
