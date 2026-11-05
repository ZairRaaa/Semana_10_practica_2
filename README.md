# Práctica de la semana 10

API de productos con Node.js, Express y MySQL.

## Preparación

1. Instalar Node.js 20 o superior y MySQL.
2. Ejecutar `npm install`.
3. Copiar `.env.example` a `.env` y completar las credenciales locales.
4. Ejecutar `npm run dev` para desarrollar o `npm start` para iniciar.
5. Consultar `GET http://localhost:3000/`: debe responder con estado 200 y JSON.

El CRUD está implementado en `http://localhost:3000/api/productos`.
Antes de utilizarlo, preparar la base de datos como se indica abajo.

## API y pruebas

| Método | Ruta | Propósito | Éxito |
| --- | --- | --- | --- |
| GET | `/` | Comprobar el servidor | 200 |
| GET | `/api/productos` | Listar productos | 200 |
| GET | `/api/productos/:id` | Consultar un producto | 200 |
| POST | `/api/productos` | Crear un producto | 201 |
| PUT | `/api/productos/:id` | Reemplazar sus datos | 200 |
| DELETE | `/api/productos/:id` | Eliminarlo físicamente | 200 |

Ejemplo de cuerpo para POST y PUT:

```json
{
  "nombre": "Cuaderno",
  "descripcion": "Cuaderno de 100 hojas",
  "precio": 12.5,
  "stock": 10
}
```

Enviar `Content-Type: application/json`. Nombre, precio y stock son obligatorios.
PUT reemplaza los datos completos; omitir la descripción la establece en `null`.
Los precios se envían como números y se devuelven como texto con dos decimales
para conservar la representación de `DECIMAL` de MySQL.

- Ejecutar `npm test`: pruebas HTTP con la base real. Se retiran los productos
  creados por la suite, sin borrar registros existentes. Requiere MySQL iniciado
  y el esquema importado; no necesita `npm start` en otra terminal.
- Importar `postman/productos.postman_collection.json` y ejecutar en orden.
  La colección guarda el ID creado y elimina ese producto al finalizar.
- Ejecutar `npm run demo:error` para iniciar una instancia separada en 3001
  con conexión de base de datos no disponible; importar
  `postman/error-500.postman_collection.json` para comprobar el 500.
  Detener la demostración con Ctrl+C. MySQL y el servidor de 3000 siguen funcionando.
- Regenerar las colecciones con `npm run postman:build` si se edita su generador.

Detalles, validaciones y solución de problemas en [docs/API.md](docs/API.md).
Respuestas HTTP registradas en [docs/evidencias-http.json](docs/evidencias-http.json).
Las capturas se describen en [docs/EVIDENCIAS.md](docs/EVIDENCIAS.md).

## Base de datos con XAMPP

1. Iniciar el módulo **MySQL** en el panel de XAMPP.
2. Importar `database/schema.sql` desde phpMyAdmin. Para usar phpMyAdmin,
   iniciar también Apache y visitar `http://localhost/phpmyadmin`.
3. Completar `DB_USER` y `DB_PASSWORD` en `.env` con los datos de tu instalación.
4. Ejecutar `npm run db:check` para comprobar la conexión y la tabla.

También se puede importar desde PowerShell, sin iniciar Apache:

```powershell
Get-Content database/schema.sql | & C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3306 -u root -p
```

El comando solicita la contraseña; si tu instalación local no tiene una,
presionar Enter. Nunca escribir contraseñas dentro de los archivos SQL.

XAMPP incluye MariaDB, que se utiliza en esta práctica mediante `mysql2/promise`.
El pool de `src/config/db.js` toma las credenciales de `.env` y permite hasta
10 conexiones. La tabla tiene `id`, `nombre`, `descripcion`, `precio`, `stock`
y `creado_en`; los importes y las existencias no pueden ser negativos.

El script SQL crea los objetos si no existen y no elimina registros.

## Herramientas verificadas

- Node.js 22.14.0 y npm 10.9.2.
- Git y Visual Studio Code, con ESLint y Prettier.
- Postman instalado para las futuras pruebas de la API.
- XAMPP en `C:\xampp`, con MariaDB 10.4.32 en el puerto 3306.
- Dependencias Express, mysql2, cors y dotenv instaladas.

No es necesario instalar Insomnia o Thunder Client si se utiliza Postman.

Durante la preparación, MariaDB no iniciaba debido a un índice dañado de
`mysql.proxies_priv`. Se respaldaron sus tres archivos en
`C:\xampp\mysql\repair-backups\20261105-100602` y se reconstruyó el índice
con `REPAIR TABLE mysql.proxies_priv USE_FRM` en modo sin conexiones de red.
La comprobación posterior `CHECK TABLE mysql.proxies_priv` devolvió `OK`.

## Organización

- `src/config`: configuración del pool de MySQL.
- `src/controllers`: lógica de productos.
- `src/routes`: rutas de productos.
- `src/app.js`: aplicación y configuración de Express.
- `src/server.js`: carga del entorno e inicio del servidor.

## Avances completados

1. Estructura y dependencias.
2. Base `db_lab10`, tabla `productos` y pool con `mysql2/promise`.
3. Listado y creación con GET y POST.
4. Consulta por ID, PUT, DELETE, validaciones y errores JSON.
5. Documentación, colecciones de Postman y pruebas automatizadas.

Cada avance tendrá un commit con una oración corta en primera persona.

## Condiciones de la guía

- Escribir manualmente al menos el 70 % de los controladores y las rutas.
- Utilizar `async/await` y consultas parametrizadas.
- Mantener las credenciales en `.env`, fuera de Git.
- Responder errores con `res.status(codigo).json({ error: 'mensaje' })`.
- No exponer detalles internos de los errores en las respuestas.
- Registrar la ayuda de IA para errores de conexión o consultas complejas con
  `// IA: [problema] → Solución manual: [explicación]`.
- Reunir capturas de estructura, controlador, configuración y pruebas HTTP
  exitosas (200/201) y de error (404/500), además del enlace de GitHub.

La guía menciona Python en el tema, pero el objetivo y los pasos solicitan
Node.js, Express y MySQL; estos últimos definen el desarrollo de esta práctica.

## Uso de IA y entrega

Por solicitud del estudiante, la implementación se completó con asistencia de IA,
incluidos los controladores, las rutas y las pruebas. Esta versión no acredita
el requisito de escribir manualmente el 70 % de controladores y rutas: ese trabajo
debe realizarlo el estudiante conforme a las condiciones de su docente.

Repositorio: [Semana_10_practica_2](https://github.com/ZairRaaa/Semana_10_practica_2).
Los avances se guardan en commits locales. Para publicarlos, ejecutar `git push origin main`.
`.env`, `info.md` y `node_modules` están ignorados.
