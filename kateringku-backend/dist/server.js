"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = require("./config/env.js");
const PORT = env_js_1.config.port;
app_js_1.default.listen(PORT, () => {
    console.log(`
=====================================================
🚀 KATERINGKU BACKEND API BERHASIL DIJALANKAN!
=====================================================
📡 URL Server       : http://localhost:${PORT}
📚 Swagger API Docs : http://localhost:${PORT}/api/docs
📦 OpenAPI JSON     : http://localhost:${PORT}/api/docs.json
💾 Database Mode    : ${env_js_1.config.dbMode}
🌍 Environment      : ${env_js_1.config.nodeEnv}
=====================================================
  `);
});
//# sourceMappingURL=server.js.map