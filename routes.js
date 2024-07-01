import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const router = Router();

/**
 * 
 * @param {string} date 
 * @returns Date
 */
function FormatDate(date) {
  const day = new Date(date).getDate();
  const month = new Date(date).getMonth();
  const year = new Date(date).getFullYear();

  return(`${day}/${month}/${year}`);
}

router.get('/cursos', async (request, response) => {
  const query = await db.events.findMany();
  let data = [];

  query.forEach((dataDb) => {
    const format = {
      id: dataDb.id,
      title: dataDb.title,
      image: dataDb.backgroundImage,
      description: FormatDate(dataDb.date),
    };

    data.push(format);
  });

  return response.status(200).json(data);
});

router.get('/curso/:id', async (request, response) => {
  const query = await db.events.findUnique({
    where: {
      id: request.params.id,
    },
  });

  if (!query) {
    response.status(404).json('Evento não encontrado');
  }

  return response.status(200).json(query);
});

export default router;
