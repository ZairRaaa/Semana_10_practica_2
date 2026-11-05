require('dotenv').config({ quiet: true });

const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, (error) => {
  if (error) {
    console.error(`No se pudo iniciar el servidor (${error.code || 'ERROR'}). Revisa si el puerto ${port} está ocupado.`);
    process.exitCode = 1;
    return;
  }
  console.log(`Servidor disponible en http://localhost:${port}`);
});
