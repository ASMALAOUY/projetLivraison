require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const { sequelize } = require('./models');
const routes        = require('./routes');
const errorHandler  = require('./middlewares/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Backend démarré !' }));
app.use('/api', routes);
app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Connexion PostgreSQL réussie');

    await sequelize.sync({ force: false, alter: true });
    console.log(' Tables synchronisées');

    app.listen(PORT, () => {
      console.log(` Serveur sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(' Erreur de démarrage :', err.message);
  }
}

startServer();