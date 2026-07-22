import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../server.js';

function requestJson(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method: 'GET',
      headers: { Accept: 'application/json' },
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

test('health endpoint returns service status', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const response = await requestJson(server, '/api/health');
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.service, 'myntra-ai-style-backend');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('wardrobe items endpoint returns clothing data', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const response = await requestJson(server, '/api/wardrobe');
    assert.equal(response.statusCode, 200);
    assert.ok(Array.isArray(response.body));
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
