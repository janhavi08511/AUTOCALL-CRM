require('dotenv').config();

const prisma = require('../src/db');

async function main() {
  console.log('Seeding loan categories...');

  const categories = [
    { name: 'Home Loan', code: 'HOME', description: 'Residential property loans' },
    { name: 'Personal Loan', code: 'PERSONAL', description: 'Unsecured personal loans' },
    { name: 'Business Loan', code: 'BUSINESS', description: 'SME and business financing' },
    { name: 'Car Loan', code: 'CAR', description: 'Vehicle financing' },
    { name: 'Education Loan', code: 'EDUCATION', description: 'Student loans' },
    { name: 'Gold Loan', code: 'GOLD', description: 'Loans against gold' },
    { name: 'Loan Against Property', code: 'LAP', description: 'Secured loans against property' }
  ];

  for (const category of categories) {
    await prisma.loanCategory.upsert({
      where: { code: category.code },
      update: category,
      create: category
    });
  }

  console.log('✅ Loan categories seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
