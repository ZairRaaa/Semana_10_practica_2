const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const producto = { nombre: 'Cuaderno de práctica', descripcion: 'Producto temporal de Postman', precio: 12.5, stock: 10 };
const productSchema = {
  type: 'object', required: ['id', 'nombre', 'descripcion', 'precio', 'stock'],
  properties: { id: { type: 'integer', minimum: 1 }, nombre: { type: 'string' },
    descripcion: { type: ['string', 'null'] }, precio: { type: 'string', pattern: '^\\d+\\.\\d{2}$' },
    stock: { type: 'integer', minimum: 0 } },
};

function item(name, method, endpoint, status, body, extraTests = [], schema) {
  const tests = [
    `pm.test('Estado ${status}', () => pm.response.to.have.status(${status}));`,
    "pm.test('Respuesta JSON', () => pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json'));",
    ...(status >= 400 ? ["pm.test('Error sin detalles internos', () => { const body = pm.response.json(); pm.expect(Object.keys(body)).to.eql(['error']); pm.expect(body.error).to.be.a('string'); });"] : []),
    ...(schema ? [`pm.test('Esquema de respuesta', () => pm.response.to.have.jsonSchema(${JSON.stringify(schema)}));`] : []),
    ...extraTests,
  ];
  return { name, request: { method, header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
    url: endpoint, description: `${name}. Respuesta esperada: ${status}.`,
    ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
  }, event: [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }] };
}

const base = '{{baseUrl}}/api/productos';
const collection = {
  info: { name: 'Práctica 10 - API de productos',
    description: 'Ejecutar en orden. Crea un producto temporal, verifica los cuatro verbos y lo elimina. No contiene credenciales de MySQL.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }, { key: 'productoId', value: '' }],
  item: [
    item('01 - Comprobar servidor', 'GET', '{{baseUrl}}/', 200),
    item('02 - Crear producto', 'POST', base, 201, producto, [
      "if (pm.response.code === 201) pm.collectionVariables.set('productoId', pm.response.json().id);",
      "pm.test('Location del producto', () => pm.expect(pm.response.headers.get('Location')).to.eql('/api/productos/' + pm.response.json().id));",
    ], productSchema),
    item('03 - Listar productos', 'GET', base, 200, undefined, [
      "pm.test('Incluye el producto creado', () => pm.expect(pm.response.json().some(p => p.id === Number(pm.collectionVariables.get('productoId')))).to.eql(true));",
    ], { type: 'array', items: productSchema }),
    item('04 - Consultar producto', 'GET', `${base}/{{productoId}}`, 200, undefined, [], productSchema),
    item('05 - Actualizar producto', 'PUT', `${base}/{{productoId}}`, 200,
      { nombre: 'Cuaderno actualizado', descripcion: null, precio: 15.9, stock: 5 }, [
        "pm.test('Datos actualizados', () => { const p = pm.response.json(); pm.expect(p.nombre).to.eql('Cuaderno actualizado'); pm.expect(p.precio).to.eql('15.90'); pm.expect(p.stock).to.eql(5); });",
      ], productSchema),
    item('06 - Rechazar precio negativo', 'POST', base, 400, { ...producto, precio: -1 }),
    item('07 - Rechazar id inválido', 'GET', `${base}/abc`, 400),
    item('08 - Eliminar producto', 'DELETE', `${base}/{{productoId}}`, 200),
    item('09 - Consultar producto eliminado', 'GET', `${base}/{{productoId}}`, 404),
    item('10 - Actualizar producto eliminado', 'PUT', `${base}/{{productoId}}`, 404, producto),
    item('11 - Eliminar otra vez', 'DELETE', `${base}/{{productoId}}`, 404),
  ],
};

const errorCollection = {
  info: { name: 'Práctica 10 - Error 500 controlado',
    description: 'Ejecutar npm run demo:error en otra terminal. Usa una instancia separada en 3001 sin detener MySQL ni modificar datos.',
    schema: collection.info.schema },
  variable: [{ key: 'errorBaseUrl', value: 'http://127.0.0.1:3001' }],
  item: [item('Error 500 por conexión no disponible', 'GET', '{{errorBaseUrl}}/api/productos', 500)],
};

const directory = path.join(__dirname, '..', 'postman');
mkdirSync(directory, { recursive: true });
for (const [filename, data] of [['productos.postman_collection.json', collection], ['error-500.postman_collection.json', errorCollection]]) {
  writeFileSync(path.join(directory, filename), JSON.stringify(data, null, 2) + '\n');
}
console.log('Colecciones de Postman generadas.');
