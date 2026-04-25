require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const { sequelize } = require('./models');
const routes        = require('./routes');
const errorHandler  = require('./middlewares/errorHandler');
const bcrypt        = require('bcryptjs');
const { User }      = require('./models');   // ← User, pas Driver

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Backend démarré !' }));
app.use('/api', routes);
app.use(errorHandler);

// ✅ Crée un livreur par défaut dans la table 'users' (role=driver)
// C'est cette table qu'utilise le système d'authentification
async function createDefaultDriver() {
  try {
    const existing = await User.findOne({ where: { phone: '0612345678', role: 'driver' } });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        name:     'hassan',
        phone:    '0612345678',
        vehicle:  'Moto',
        password: hashedPassword,
        role:     'driver',
        status:   'active',
      });
      console.log('✅ Livreur par défaut créé dans users (hassan / 0612345678 / 123456)');
    } else {
      console.log('ℹ️ Livreur déjà existant dans users, création ignorée');
    }
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.log('ℹ️ Livreur déjà existant (contrainte unique)');
    } else {
      console.error('⚠️ Erreur création livreur:', err.message);
    }
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log(' Connexion PostgreSQL réussie');

    await sequelize.sync({ force: false, alter: true });
    console.log(' Tables synchronisées');

    await createDefaultDriver();

    //  '0.0.0.0' = écoute sur toutes les interfaces réseau
    // Nécessaire pour que les appareils Android/iOS accèdent au serveur
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur sur http://0.0.0.0:${PORT}`);
      console.log(`📱 Depuis mobile : http://192.168.8.114:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erreur de démarrage :', err.message);
  }
}

startServer();