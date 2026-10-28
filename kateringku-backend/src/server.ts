import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
=====================================================
🚀 KATERINGKU BACKEND API BERHASIL DIJALANKAN!
=====================================================
📡 URL Server       : http://localhost:${PORT}
📚 Swagger API Docs : http://localhost:${PORT}/api/docs
📦 OpenAPI JSON     : http://localhost:${PORT}/api/docs.json
💾 Database Mode    : ${config.dbMode}
🌍 Environment      : ${config.nodeEnv}
=====================================================
  `);
});
