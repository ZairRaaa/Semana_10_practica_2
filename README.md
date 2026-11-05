# Práctica de la semana 10

API de productos con Node.js, Express y MySQL.

## Preparación

1. Instalar Node.js 20 o superior y MySQL.
2. Ejecutar `npm install`.
3. Copiar `.env.example` a `.env` y completar las credenciales locales.
4. Ejecutar `npm run dev` para desarrollar o `npm start` para iniciar.
5. Consultar `GET http://localhost:3000/`: debe responder con estado 200 y JSON.

Los endpoints de productos todavía están pendientes.
El servidor base puede iniciarse sin una base de datos configurada.

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

## Avances previstos

1. Preparar la estructura y las dependencias.
2. Crear `db_lab10`, la tabla `productos` y el pool con `mysql2/promise`.
3. Implementar el listado y la creación con GET y POST.
4. Implementar PUT y DELETE; validar entradas y respuestas 400, 404 y 500.
5. Documentar los endpoints y preparar una colección de Postman.

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
