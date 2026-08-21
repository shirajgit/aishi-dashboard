import 'dotenv/config';
import { prisma } from '../src/db.js';
import { seedDatabase } from '../src/index.js';

seedDatabase()
  .then(() => console.log('✔ Seeded demo data'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
