"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_js_1 = require("./config/env.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const errorHandler_js_1 = require("./middlewares/errorHandler.js");
const swagger_js_1 = require("./docs/swagger.js");
function createApp() {
    const app = (0, express_1.default)();
    // API dinamis tidak memakai ETag → server tidak pernah membalas 304
    app.set('etag', false);
    // Security headers & CORS
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Memungkinkan Swagger UI berjalan dengan lancar
    }));
    app.use((0, cors_1.default)({
        origin: env_js_1.config.corsOrigin,
        credentials: true,
    }));
    // Logger & Parsers
    if (env_js_1.config.nodeEnv !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Respons API tidak boleh di-cache browser/proxy → cegah 304 & data basi.
    // (kecuali /api/docs & /api/docs.json — dokumentasi Swagger tetap boleh cache)
    app.use('/api', (req, res, next) => {
        if (!req.path.startsWith('/docs')) {
            res.set('Cache-Control', 'no-store');
        }
        next();
    });
    // Swagger Documentation
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_js_1.swaggerDocument));
    app.get('/api/docs.json', (req, res) => {
        res.json(swagger_js_1.swaggerDocument);
    });
    // Root Welcome & redirect to docs
    app.get('/', (req, res) => {
        res.json({
            nama: 'KateringKu Backend API',
            versi: '1.0.0',
            dokumentasi: '/api/docs',
            status: 'berjalan',
            db_mode: env_js_1.config.dbMode,
        });
    });
    // Mount API router
    app.use('/api', index_js_1.default);
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            sukses: false,
            pesan: `Rute ${req.method} ${req.originalUrl} tidak ditemukan`,
        });
    });
    // Centralized Error handler
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
exports.default = createApp();
//# sourceMappingURL=app.js.map