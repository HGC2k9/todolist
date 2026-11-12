// ============================================================
// Unit Test: Web Crypto Auth (PBKDF2 & JWT)
// ============================================================

import {
  generateSalt,
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
  setSessionCookie,
  clearSessionCookie,
  parseCookies,
  generateId,
} from '../src/auth';

async function runTests() {
  console.log('🧪 Bắt đầu chạy kiểm thử hệ thống Auth & Crypto...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Kiểm tra tạo UUID
  const id1 = generateId();
  const id2 = generateId();
  assert(id1.length === 36 && id1 !== id2, 'generateId() sinh ra UUID v4 hợp lệ và duy nhất');

  // 2. Kiểm tra Salt
  const salt1 = generateSalt();
  const salt2 = generateSalt();
  assert(salt1.length === 64 && salt1 !== salt2, 'generateSalt() sinh ra chuỗi hex 32 bytes ngẫu nhiên');

  // 3. Kiểm tra Hash và Verify Mật khẩu (PBKDF2)
  const password = 'MySecurePassword@123';
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  assert(hash.length === 64, 'hashPassword() trả về hex digest 256-bit (64 ký tự hex)');

  const isMatchCorrect = await verifyPassword(password, salt, hash);
  assert(isMatchCorrect === true, 'verifyPassword() xác thực đúng mật khẩu hợp lệ');

  const isMatchWrong = await verifyPassword('WrongPassword', salt, hash);
  assert(isMatchWrong === false, 'verifyPassword() từ chối mật khẩu sai');

  // 4. Kiểm tra Tạo và Xác thực JWT (HMAC-SHA256)
  const secret = 'super-secret-key-for-testing-123456';
  const payload = {
    sub: 'user-uuid-123',
    email: 'test@example.com',
    username: 'tester',
  };

  const token = await createJWT(payload, secret, 3600);
  assert(token.split('.').length === 3, 'createJWT() trả về token chuẩn 3 phần: Header.Payload.Signature');

  const verified = await verifyJWT(token, secret);
  assert(
    verified !== null && verified.sub === payload.sub && verified.email === payload.email,
    'verifyJWT() giải mã và xác thực chữ ký token thành công'
  );

  const tamperedToken = token.slice(0, -5) + 'xxxxx';
  const verifiedTampered = await verifyJWT(tamperedToken, secret);
  assert(verifiedTampered === null, 'verifyJWT() phát hiện và từ chối token bị giả mạo chữ ký');

  const wrongSecretVerified = await verifyJWT(token, 'wrong-secret-key');
  assert(wrongSecretVerified === null, 'verifyJWT() từ chối token khi dùng sai secret');

  // 5. Kiểm tra Cookie parser & builder
  const cookieStr = setSessionCookie('test_session', token, 3600);
  assert(
    cookieStr.includes('HttpOnly') && cookieStr.includes('SameSite=Strict') && cookieStr.includes('Secure'),
    'setSessionCookie() có đầy đủ cờ bảo mật HttpOnly, Secure, SameSite=Strict'
  );

  const clearCookie = clearSessionCookie('test_session');
  assert(clearCookie.includes('Max-Age=0'), 'clearSessionCookie() xóa cookie với Max-Age=0');

  const parsed = parseCookies('foo=bar; test_session=12345; user=alex');
  assert(parsed['test_session'] === '12345' && parsed['foo'] === 'bar', 'parseCookies() bóc tách cookie chính xác');

  console.log(`\n📊 Kết quả: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Lỗi khi chạy test:', err);
  process.exit(1);
});

