import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import axios from 'axios';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/', routes);

async function getRender() {
  // Chama o endpoint a cada 10 segundos (10000 milissegundos)
  setInterval(async () => {
    try {
      const { status } = await axios.get('https://iplanner-api.onrender.com');
      console.log(status);
    } catch (error) {
      console.error('Erro ao chamar o endpoint:', error);
    }
  }, 1000000);
}

app.listen(3333, () => {
  console.log('Servidor rodando na porta 3333');
  getRender();
});
