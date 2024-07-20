import { Router } from 'express';
import { createTransport } from 'nodemailer';
import ical from 'ical-generator';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const router = Router();

const transporter = createTransport({
  auth: {
    user: '582ed1dc238f3e',
    pass: '93b4d1c09a5124',
  },
  host: 'sandbox.smtp.mailtrap.io',
  port: 587,
});

const generateIcal = (event) => {
  const calendar = ical({
    domain: 'iplanner.net.br',
    name: 'Evento',
    timezone: 'UTC',
  });

  calendar.createEvent({
    start: event.date,
    end: new Date(event.date.getTime() + 60 * 60 * 1000), // Supondo que a duração seja de 1 hora
    summary: event.title,
    description: event.descriptionEvent,
    location: event.local,
    organizer: {
      name: 'Iplanner',
      email: 'contato@iplanner.net.br',
    },
  });

  return calendar.toString();
};

function FormatDate(date) {
  const day = new Date(date).getDate();
  const month = new Date(date).getMonth();
  const year = new Date(date).getFullYear();

  return `${day}/${month}/${year}`;
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
    include: {
      speaker: true,
    },
  });

  if (!query) {
    response.status(404).json('Evento não encontrado');
  }

  return response.status(200).json(query);
});

router.post('/send-mail', async (req, res) => {
  const { email, name, eventId } = req.body;

  console.log('Dados recebidos:', { email, name, eventId });

  try {
    if (!email || !name || !eventId) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const event = await db.events.findUnique({
      where: { id: eventId },
      include: {
        speaker: true,
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    const icsEventContent = generateIcal(event);

    const mailOptions = {
      from: 'Iplanner <contato@iplanner.net.br>',
      to: email,
      subject: 'Confirmação de presença no evento.',
      text: `Olá ${name}, este é um e-mail de confirmação de presença do evento. Encontre o convite em anexo.`,
      attachments: [
        {
          filename: 'meeting.ics',
          content: icsEventContent,
          encoding: 'utf-8',
          contentType: 'text/calendar',
        },
      ],
    };

    console.log('Sending email to:', email); // Log de Debug

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'E-mail enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    res.status(500).json({ message: 'Erro ao enviar o e-mail' });
  }
});

export default router;
