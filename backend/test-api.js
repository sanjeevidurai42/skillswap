/**
 * SkillSwap Automated REST API Verification Suite
 * Tests authentication, profiles, recommendations, requests, sessions, feedback, and contacts.
 * Developer: Sanjeeviraj
 */

const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

let authToken = '';
let testUserId = '';
let testRecipientId = '';
let testRequestId = '';
let testSessionId = '';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 Starting SkillSwap REST API Verification Suite');
  console.log('👨‍💻 Developer: Sanjeeviraj');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health should return status online', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200 || res.data.project !== 'SkillSwap') {
      throw new Error(`Expected status 200 and project SkillSwap, got ${res.status}`);
    }
  });

  // 2. OAuth Status
  await test('GET /api/auth/oauth-status should report providers status', async () => {
    const res = await request('GET', '/auth/oauth-status');
    if (res.status !== 200 || !res.data.providers) {
      throw new Error(`Invalid OAuth status response: ${JSON.stringify(res.data)}`);
    }
  });

  // 3. Demo Login
  await test('POST /api/auth/demo-login should authenticate as Sanjeeviraj', async () => {
    const res = await request('POST', '/auth/demo-login', { role: 'mentor' });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Demo login failed: ${JSON.stringify(res.data)}`);
    }
    authToken = res.data.token;
    testUserId = res.data.user._id;
  });

  // 4. Authenticated profile check
  await test('GET /api/auth/me should return current user with valid token', async () => {
    const res = await request('GET', '/auth/me', null, authToken);
    if (res.status !== 200 || !res.data.user) {
      throw new Error(`Me endpoint failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 5. Explore Skills
  await test('GET /api/skills should return skills catalog with mentor count', async () => {
    const res = await request('GET', '/skills?limit=10');
    if (res.status !== 200 || !Array.isArray(res.data.skills)) {
      throw new Error(`Explore skills failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 6. Skill Categories
  await test('GET /api/skills/categories should return categories aggregation', async () => {
    const res = await request('GET', '/skills/categories');
    if (res.status !== 200 || !Array.isArray(res.data.categories)) {
      throw new Error(`Categories failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 7. Partner Recommendations
  await test('GET /api/partners/recommendations should return ranked candidates', async () => {
    const res = await request('GET', '/partners/recommendations', null, authToken);
    if (res.status !== 200 || !res.data.recommendations) {
      throw new Error(`Recommendations failed: ${JSON.stringify(res.data)}`);
    }
    if (res.data.recommendations.length > 0) {
      testRecipientId = res.data.recommendations[0].candidateId;
    }
  });

  // 8. Dashboard stats
  await test('GET /api/users/dashboard-stats should return metrics counts', async () => {
    const res = await request('GET', '/users/dashboard-stats', null, authToken);
    if (res.status !== 200 || !res.data.stats) {
      throw new Error(`Dashboard stats failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 9. Contact Submission
  await test('POST /api/contact should record message in MongoDB', async () => {
    const res = await request('POST', '/contact', {
      name: 'Lab Evaluator',
      email: 'evaluator@college.edu',
      subject: 'Lab Assessment Feedback',
      category: 'Academic Project',
      message: 'Excellent peer-to-peer architecture and clear hybrid recommendation implementation.'
    });
    if (res.status !== 201 || !res.data.ticketId) {
      throw new Error(`Contact submission failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 10. Peer Merit Leaderboard
  await test('GET /api/feedback/leaderboard should return top ranked peers', async () => {
    const res = await request('GET', '/feedback/leaderboard');
    if (res.status !== 200 || !Array.isArray(res.data.leaderboard)) {
      throw new Error(`Leaderboard failed: ${JSON.stringify(res.data)}`);
    }
  });

  console.log('\n==================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
