const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const app = require('../src/app');
const pool = require('../src/config/db');

test('API de productos con MySQL real', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const evidencias = [];
  const creados = new Set();
  let id;
  const producto = { nombre: 'Prueba de la práctica', descripcion: 'Registro temporal', precio: 12.5, stock: 3 };

  async function request(method, url, expected, body, headers = {}) {
    const response = await fetch(baseUrl + url, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    });
    const json = await response.json();
    // Registrar incluso una creación cuyo código o contenido no supere las aserciones.
    if (method === 'POST' && response.status === 201 && Number.isInteger(json.id)) creados.add(json.id);
    evidencias.push({ metodo: method, ruta: url, esperado: expected, estado: response.status,
      contentType: response.headers.get('content-type'), respuesta: json });
    assert.equal(response.status, expected);
    assert.match(response.headers.get('content-type'), /^application\/json/);
    if (expected >= 400) {
      assert.deepEqual(Object.keys(json), ['error']);
      assert.equal(typeof json.error, 'string');
    }
    return { json, response };
  }

  try {
    await t.test('la interfaz y sus recursos se sirven sin exponer archivos privados', async () => {
      const page = await fetch(baseUrl + '/productos');
      assert.equal(page.status, 200);
      assert.match(page.headers.get('content-type'), /text\/html/);
      const html = await page.text();
      assert.match(html, /id="product-form"/);
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
      assert.equal(new Set(ids).size, ids.length, 'Los identificadores HTML deben ser únicos');
      for (const resource of ['/assets/styles.css', '/assets/app.js']) {
        const response = await fetch(baseUrl + resource);
        assert.equal(response.status, 200);
      }
      await request('GET', '/assets/.env', 404);
      await request('GET', '/assets/..%2f.env', 404);
    });
    await t.test('salud del servidor en JSON', async () => {
      await request('GET', '/', 200);
    });
    await t.test('POST persiste un producto y devuelve Location', async () => {
      const result = await request('POST', '/api/productos', 201, producto);
      id = result.json.id;
      assert.ok(Number.isInteger(id));
      assert.equal(result.response.headers.get('location'), `/api/productos/${id}`);
      const [rows] = await pool.execute('SELECT nombre FROM productos WHERE id = ?', [id]);
      assert.equal(rows[0].nombre, producto.nombre);
    });
    await t.test('GET lista y consulta por ID el producto guardado', async () => {
      const listado = await request('GET', '/api/productos', 200);
      assert.ok(listado.json.some((item) => item.id === id));
      const result = await request('GET', `/api/productos/${id}`, 200);
      assert.equal(result.json.precio, '12.50');
      assert.equal(result.json.stock, 3);
      assert.ok(result.json.creado_en);
    });
    await t.test('PUT modifica los datos y permite repetir los mismos valores', async () => {
      const actualizado = { nombre: 'Producto actualizado', precio: 25.99, stock: 0 };
      await request('PUT', `/api/productos/${id}`, 200, actualizado);
      await request('PUT', `/api/productos/${id}`, 200, actualizado);
      const result = await request('GET', `/api/productos/${id}`, 200);
      assert.equal(result.json.nombre, actualizado.nombre);
      assert.equal(result.json.precio, '25.99');
      assert.equal(result.json.descripcion, null);
      assert.equal(result.json.stock, 0);
    });
    await t.test('valida cuerpos, límites y tipos sin modificar datos', async () => {
      const invalidos = [null, [], {}, { ...producto, nombre: ' ' }, { ...producto, nombre: 'a'.repeat(101) },
        { ...producto, precio: -1 }, { ...producto, precio: 1.999 }, { ...producto, precio: 100000000 },
        { ...producto, precio: '12.50' }, { ...producto, precio: null }, { ...producto, precio: true },
        { ...producto, stock: -1 }, { ...producto, stock: 0.5 }, { ...producto, stock: 2147483648 },
        { ...producto, descripcion: {} }, { ...producto, descripcion: 'ñ'.repeat(32768) },
        { ...producto, id: 1 }];
      for (const body of invalidos) await request('POST', '/api/productos', 400, body);
      await request('PUT', `/api/productos/${id}`, 400, { nombre: 'Incompleto' });
      const result = await request('GET', `/api/productos/${id}`, 200);
      assert.equal(result.json.nombre, 'Producto actualizado');
    });
    await t.test('valida identificadores antes de consultar SQL', async () => {
      for (const invalidId of ['0', '-1', '1.5', 'abc', '4294967296', '1%20OR%201=1']) {
        for (const method of ['GET', 'PUT', 'DELETE']) {
          await request(method, `/api/productos/${invalidId}`, 400, method === 'PUT' ? producto : undefined);
        }
      }
    });
    await t.test('rechaza JSON mal formado, tipos incorrectos y cuerpos excesivos', async () => {
      await request('POST', '/api/productos', 400, '{"nombre":');
      await request('POST', '/api/productos', 415, '{}', { 'Content-Type': 'text/plain' });
      await request('POST', '/api/productos', 415);
      await request('POST', '/api/productos', 413, { ...producto, descripcion: 'a'.repeat(110000) });
    });
    await t.test('las consultas parametrizadas conservan texto parecido a SQL', async () => {
      const nombre = "Prueba '); DROP TABLE productos; --";
      const result = await request('POST', '/api/productos', 201, { nombre, precio: 0, stock: 0 });
      const guardado = await request('GET', `/api/productos/${result.json.id}`, 200);
      assert.equal(guardado.json.nombre, nombre);
    });
    await t.test('rutas desconocidas responden 404 JSON', async () => {
      await request('GET', '/no-existe', 404);
    });
    await t.test('DELETE elimina físicamente y los siguientes accesos devuelven 404', async () => {
      await request('DELETE', `/api/productos/${id}`, 200);
      const [rows] = await pool.execute('SELECT id FROM productos WHERE id = ?', [id]);
      assert.equal(rows.length, 0);
      await request('GET', `/api/productos/${id}`, 404);
      await request('PUT', `/api/productos/${id}`, 404, producto);
      await request('DELETE', `/api/productos/${id}`, 404);
    });
    await t.test('fallos de base de datos responden 500 sin filtrar detalles internos', async () => {
      const execute = pool.execute;
      pool.execute = async () => { throw Object.assign(new Error('detalle SQL privado'), { code: 'TEST_DB_FAILURE' }); };
      try {
        for (const [method, url, body] of [
          ['GET', '/api/productos'], ['GET', `/api/productos/${id}`],
          ['POST', '/api/productos', producto], ['PUT', `/api/productos/${id}`, producto],
          ['DELETE', `/api/productos/${id}`],
        ]) {
          const result = await request(method, url, 500, body);
          assert.deepEqual(result.json, { error: 'No se pudo completar la operación' });
        }
      } finally {
        pool.execute = execute;
      }
    });
  } finally {
    for (const createdId of creados) await pool.execute('DELETE FROM productos WHERE id = ?', [createdId]);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
    if (process.env.CAPTURE_EVIDENCE === '1') {
      const evidenceDir = path.join(__dirname, '..', 'docs');
      mkdirSync(evidenceDir, { recursive: true });
      writeFileSync(path.join(evidenceDir, 'evidencias-http.json'), JSON.stringify({
        fecha: new Date().toISOString(),
        nota: 'Respuestas HTTP reales de la suite. Solo los fallos 500 se simulan sustituyendo temporalmente pool.execute; MySQL no se detiene.',
        solicitudes: evidencias,
      }, null, 2) + '\n');
    }
  }
});
