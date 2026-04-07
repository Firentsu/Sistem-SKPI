// check-password.js
const bcrypt = require('bcryptjs');

(async () => {
  const plain = 'SuperAdmin123!'; // password yang ingin dicek
  const hash = '$2b$10$xfjxqmBNZN4dCvmV.qdTb.CloMXISPu4yxd.VKON4He9s7XfYFe8u'; // ganti dengan hash dari DB
  const ok = await bcrypt.compare(plain, hash);
  console.log(ok ? 'MATCH' : 'NO MATCH');
})();
