const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Loan Categories
  const categories = [
    { name: 'Home Loan',             code: 'HOME',      description: 'Residential property loans' },
    { name: 'Personal Loan',         code: 'PERSONAL',  description: 'Unsecured personal loans' },
    { name: 'Business Loan',         code: 'BUSINESS',  description: 'SME and business financing' },
    { name: 'Car Loan',              code: 'CAR',       description: 'Vehicle financing' },
    { name: 'Education Loan',        code: 'EDUCATION', description: 'Student loans' },
    { name: 'Gold Loan',             code: 'GOLD',      description: 'Loans against gold' },
    { name: 'Loan Against Property', code: 'LAP',       description: 'Secured loans against property' }
  ];

  for (const cat of categories) {
    await prisma.loanCategory.upsert({
      where: { code: cat.code },
      update: { name: cat.name, description: cat.description },
      create: cat
    });
  }
  console.log('✅ Loan categories seeded');

  // Users
  const users = [
    { username: 'admin',    email: 'admin@crm.com',    password: 'admin123',    name: 'System Administrator', role: 'ADMIN',   managerId: null },
    { username: 'manager1', email: 'manager1@crm.com', password: 'manager123',  name: 'Rajesh Kumar',         role: 'MANAGER', managerId: null },
    { username: 'staff1',   email: 'staff1@crm.com',   password: 'staff123',    name: 'Priya Sharma',         role: 'STAFF',   managerUsername: 'manager1' },
    { username: 'staff2',   email: 'staff2@crm.com',   password: 'staff123',    name: 'Amit Patel',           role: 'STAFF',   managerUsername: 'manager1' },
    { username: 'staff3',   email: 'staff3@crm.com',   password: 'staff123',    name: 'Sneha Verma',          role: 'STAFF',   managerUsername: 'manager1' }
  ];

  const createdUsers = {};

  // Create admin and manager first
  for (const u of users.filter(u => u.role !== 'STAFF')) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { email: u.email, name: u.name, isActive: true },
      create: { username: u.username, email: u.email, password: hashed, name: u.name, role: u.role, isActive: true }
    });
    createdUsers[u.username] = user;
    console.log(`✅ ${u.role}: ${u.username} / ${u.password}`);
  }

  // Create staff with managerId
  for (const u of users.filter(u => u.role === 'STAFF')) {
    const hashed = await bcrypt.hash(u.password, 10);
    const managerId = createdUsers[u.managerUsername]?.id;
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { email: u.email, name: u.name, managerId, isActive: true },
      create: { username: u.username, email: u.email, password: hashed, name: u.name, role: u.role, managerId, isActive: true }
    });
    createdUsers[u.username] = user;
    console.log(`✅ STAFF: ${u.username} / ${u.password}`);
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin   : admin / admin123');
  console.log('  Manager : manager1 / manager123');
  console.log('  Staff   : staff1, staff2, staff3 / staff123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
