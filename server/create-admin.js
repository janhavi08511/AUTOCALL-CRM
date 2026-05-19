const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = require('./src/db');

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123';
  const email = 'admin@crm.com';
  const name = 'System Administrator';

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Admin user created successfully');
  console.log('Username:', username);
  console.log('Password:', password);
  console.log('Email:', email);
}

createAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
