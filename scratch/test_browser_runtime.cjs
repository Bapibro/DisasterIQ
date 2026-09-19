const http = require('http');

// Check if dev server is up and verify index.html bundle tags
http.get('http://localhost:5177/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('--- HTML INDEX BUNDLE INSPECTION ---');
    console.log('Has index script tag:', body.includes('src="/src/main.tsx"'));
    console.log('Has root div:', body.includes('id="root"'));
    console.log('Status code:', res.statusCode);
  });
});
