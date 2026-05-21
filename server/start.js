const { execSync } = require('child_process');

console.log('🔧 Running database setup...');

try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema synced');
} catch (e) {
  console.error('❌ db push failed:', e.message);
  process.exit(1);
}

try {
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  console.log('✅ Database seeded');
} catch (e) {
  console.log('⚠️ Seed skipped (may already exist)');
}

require('./src/index.js');
