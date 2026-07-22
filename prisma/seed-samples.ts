// @ts-nocheck
import { PrismaClient } from '../prisma/generated/prisma/client';

const prisma = new PrismaClient();

const SAMPLES = [
  {
    title: 'Todo App',
    description: 'Create lists, add tasks, mark them done.',
    category: 'Productivity',
    prompt: 'A simple todo app where I can create lists, add tasks, and mark them done.',
    featured: true,
  },
  {
    title: 'Feedback Board',
    description: 'Users submit and vote on ideas.',
    category: 'Community',
    prompt: 'A place where users can submit feedback and vote on ideas, like a mini Canny.',
    featured: true,
  },
  {
    title: 'Expense Tracker',
    description: 'Log spending, see monthly charts.',
    category: 'Finance',
    prompt: 'An app to log expenses, categorize them, and see monthly spending charts.',
  },
  {
    title: 'Event RSVP Tool',
    description: 'Create events, share a link, collect RSVPs.',
    category: 'Events',
    prompt: 'A tool where I can create an event and let people RSVP with a simple link.',
  },
  {
    title: 'Recipe Box',
    description: 'Save and organize favorite recipes.',
    category: 'Lifestyle',
    prompt: 'An app to save recipes with ingredients, steps, and tags for easy searching.',
  },
  {
    title: 'Habit Tracker',
    description: 'Track daily habits with streaks.',
    category: 'Productivity',
    prompt: 'A habit tracker where I check off daily habits and see my streak.',
  },
  {
    title: 'Job Application Tracker',
    description: 'Track applications and their status.',
    category: 'Career',
    prompt: 'A board to track job applications: company, status, and notes.',
  },
  {
    title: 'Reading List',
    description: 'Track books to read and finished.',
    category: 'Lifestyle',
    prompt: 'An app to track books I want to read, am reading, and have finished, with ratings.',
  },
];

async function main() {
  for (const sample of SAMPLES) {
    await prisma.sampleProject.upsert({
      where: { title: sample.title },
      create: sample,
      update: sample,
    });
  }
  console.log(`Seeded ${SAMPLES.length} sample projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
