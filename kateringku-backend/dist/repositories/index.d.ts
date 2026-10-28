import { IRepository } from './interface.js';
export declare function getRepository(): IRepository;
export declare function setRepository(repo: IRepository): void;
export * from './interface.js';
export * from './memoryRepo.js';
export * from './prismaRepo.js';
