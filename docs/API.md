# API de productos

Servidor local: `http://localhost:3000`. Base: `db_lab10`.
Todas las respuestas de la aplicación se devuelven como JSON.

## Endpoints

| Método y ruta | Respuesta |
| --- | --- |
| `GET /` | 200 con mensaje de funcionamiento; no comprueba la base |
| `GET /api/productos` | 200 con un arreglo ordenado por ID; `[]` si está vacío |
| `GET /api/productos/:id` | 200 con el producto o 404 si no existe |
| `POST /api/productos` | 201 con los datos creados y cabecera `Location` |
| `PUT /api/productos/:id` | 200 con los datos actualizados o 404 si no existe |
| `DELETE /api/productos/:id` | 200 con mensaje e ID o 404 si no existe |

POST y PUT devuelven `id`, `nombre`, `descripcion`, `precio` y `stock`.
GET incluye además `creado_en`, generado por la base de datos.
DELETE realiza una eliminación física. PUT es un reemplazo completo de los
campos editables y no modifica ni el ID ni la fecha de creación.
Repetir PUT con los mismos valores devuelve 200 si el producto sigue existiendo.

## Validaciones

| Campo | Regla |
| --- | --- |
| `id` de la ruta | Entero de 1 a 4294967295, sin signos, espacios o ceros iniciales |
| `nombre` | Texto obligatorio de 1 a 100 caracteres; se recortan espacios externos |
| `descripcion` | Opcional; texto de hasta 65535 bytes UTF-8 o `null` |
| `precio` | Número obligatorio entre 0 y 99999999.99, con hasta dos decimales |
| `stock` | Número entero obligatorio entre 0 y 2147483647 |

No se aceptan campos adicionales. No enviar números entre comillas.
El cuerpo debe ser un objeto JSON, con un tamaño máximo de 100 KB.
Las restricciones SQL también impiden precios y existencias negativos.

## Errores

Todos siguen la forma `{ "error": "mensaje" }`.

| Estado | Situación |
| --- | --- |
| 400 | ID o datos inválidos, cuerpo incompleto o JSON mal formado |
| 404 | Producto o ruta inexistente |
| 413 | Cuerpo mayor de 100 KB |
| 415 | POST o PUT sin `Content-Type: application/json` |
| 500 | Fallo interno, por ejemplo conexión de base de datos no disponible |

Los errores inesperados se registran en la terminal mediante su código; no se
devuelven contraseñas, consultas SQL, mensajes del driver ni stack traces.
Las entradas se pasan mediante parámetros `?` a `pool.execute()`.

## Ejemplo con PowerShell

Con MySQL iniciado y `npm start` ejecutándose en otra terminal:

```powershell
$producto = @{ nombre = 'Cuaderno'; descripcion = '100 hojas'; precio = 12.5; stock = 10 } | ConvertTo-Json
$creado = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/productos -ContentType application/json -Body $producto
Invoke-RestMethod -Uri "http://localhost:3000/api/productos/$($creado.id)"
$cambio = @{ nombre = 'Cuaderno actualizado'; precio = 15.9; stock = 5 } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "http://localhost:3000/api/productos/$($creado.id)" -ContentType application/json -Body $cambio
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/api/productos/$($creado.id)"
```

## Postman

1. Importar `postman/productos.postman_collection.json`.
2. Mantener `baseUrl` en `http://localhost:3000` o ajustarlo a tu puerto.
3. Ejecutar las 11 solicitudes en el orden numerado.
4. Verificar las pruebas de estado HTTP, Content-Type, estructura JSON y datos.
5. Capturar la respuesta y el estado visibles para 200, 201, 400 y 404.

Para 500, ejecutar `npm run demo:error` e importar la segunda colección.
Esta instancia apunta al puerto de base de datos local 1, que no tiene un
servidor MySQL, y escucha como API en 3001. Es una demostración separada:
no hace falta detener o dañar la base de datos utilizada por la práctica.

Si Postman está en modo Lightweight API Client, pueden enviarse solicitudes
individuales sin cuenta. La organización en colecciones depende de las opciones
disponibles en esa modalidad; los archivos JSON quedan listos para importar.

## Verificación automatizada

`npm test` ejecuta 11 casos dentro de una prueba principal. Comprueba
persistencia real, cuatro verbos HTTP, actualizaciones repetidas, límites,
identificadores inválidos, JSON, Content-Type, eliminación y respuestas de error.
La prueba 500 sustituye temporalmente `pool.execute` para simular un fallo:
no detiene MySQL. Los demás casos se ejecutan contra la base configurada en `.env`.
La suite abre un puerto HTTP disponible y elimina únicamente sus propios registros.

Para volver a registrar las respuestas como evidencia desde PowerShell:

```powershell
$env:CAPTURE_EVIDENCE = '1'
try { npm test } finally { Remove-Item Env:CAPTURE_EVIDENCE }
```

## Solución de problemas

- Conexión rechazada: iniciar MySQL desde XAMPP y verificar `DB_HOST` y `DB_PORT`.
- Acceso denegado: revisar `DB_USER` y `DB_PASSWORD` en `.env`.
- Base o tabla inexistente: importar `database/schema.sql` y ejecutar `npm run db:check`.
- Puerto 3000 ocupado: detener la instancia anterior o cambiar `PORT` en `.env` y `baseUrl` en Postman.
- `GET /` funciona pero productos responde 500: el servidor HTTP está activo;
  ejecutar `npm run db:check` para revisar la conexión y el esquema.

## Referencias oficiales

- [Express: manejo de errores](https://expressjs.com/en/5x/guide/error-handling/).
- [mysql2: pools con promesas](https://sidorares.github.io/node-mysql2/docs/examples/connections/create-pool).
- [Postman: pruebas de respuestas](https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/).
