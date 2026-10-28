"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepository = getRepository;
exports.setRepository = setRepository;
const memoryRepo_js_1 = require("./memoryRepo.js");
const prismaRepo_js_1 = require("./prismaRepo.js");
const env_js_1 = require("../config/env.js");
let defaultRepo;
function getRepository() {
    if (!defaultRepo) {
        if (env_js_1.config.dbMode === 'postgres' && env_js_1.config.databaseUrl) {
            console.log('📦 Menggunakan PostgreSQL (Neon) via Prisma');
            defaultRepo = new prismaRepo_js_1.PrismaRepository();
        }
        else {
            console.log('🧠 Menggunakan Memory Repository (Mode Standalone / Demo Cepat)');
            defaultRepo = new memoryRepo_js_1.MemoryRepository();
        }
    }
    return defaultRepo;
}
function setRepository(repo) {
    defaultRepo = repo;
}
__exportStar(require("./interface.js"), exports);
__exportStar(require("./memoryRepo.js"), exports);
__exportStar(require("./prismaRepo.js"), exports);
//# sourceMappingURL=index.js.map