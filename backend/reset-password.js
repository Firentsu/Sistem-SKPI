// reset-password-updateMany.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const username = 'superadmin';
    const newPlain = 'SuperAdmin123!';
    const hashed = await bcrypt.hash(newPlain, 10);

    const result = await prisma.users.updateMany({
      where: { username },
      data: { password: hashed }
    });

    console.log('Updated count:', result.count);
  } catch (e) {
    console.error('Error updating password:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
