const http = require('http');

const routes = [
  '/',
  '/learn',
  '/learn/earthquake',
  '/learn/flood',
  '/learn/fire',
  '/learn/cyclone',
  '/learn/landslide',
  '/learn/lightning',
  '/prepare',
  '/quiz',
  '/guide',
  '/campus',
  '/disasters',
  '/profile',
  '/student',
  '/teacher',
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:5177' + path, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const hasRoot = data.includes('id="root"');
        resolve({ path, status: res.statusCode, hasRoot, length: data.length });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log('--- ROUTE STABILITY VERIFICATION ---');
  let failures = 0;
  for (const path of routes) {
    const res = await checkRoute(path);
    if (res.error) {
      console.log(`❌ ${path}: Error - ${res.error}`);
      failures++;
    } else if (res.status === 200 && res.hasRoot) {
      console.log(`✅ ${path}: Status 200 OK (Root container present)`);
    } else {
      console.log(`❌ ${path}: Status ${res.status}, Root: ${res.hasRoot}`);
      failures++;
    }
  }
  console.log('--- SUMMARY ---');
  console.log(`Total Routes Tested: ${routes.length}`);
  console.log(`Passed: ${routes.length - failures}`);
  console.log(`Failed: ${failures}`);
}

run();
