import { IRepository } from './interface.js';
import { MemoryRepository } from './memoryRepo.js';
import { PrismaRepository } from './prismaRepo.js';
import { config } from '../config/env.js';

let defaultRepo: IRepository;

export function getRepository(): IRepository {
  if (!defaultRepo) {
    if (config.dbMode === 'postgres' && config.databaseUrl) {
      console.log('📦 Menggunakan PostgreSQL (Neon) via Prisma');
      defaultRepo = new PrismaRepository();
    } else {
      console.log('🧠 Menggunakan Memory Repository (Mode Standalone / Demo Cepat)');
      defaultRepo = new MemoryRepository();
    }
  }
  return defaultRepo;
}

export function setRepository(repo: IRepository): void {
  defaultRepo = repo;
}

export * from './interface.js';
export * from './memoryRepo.js';
export * from './prismaRepo.js';
