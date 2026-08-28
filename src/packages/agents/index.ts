/**
 * @file index.ts
 * @package @ai-teams/agents
 * @description Master Package Entry Point for AI Teams Autonomous Agent Workforce.
 * Exposes core execution engines, deliverable contracts, memory layers, sandboxed tools, registries, and AI employee roles.
 */

export * from './core';
export * from './contracts';
export * from './memory';
export * from './tools';
export * from './roles';
export * from './manager/agent.registry';
export * from './manager/agent.manager';
export * from './artifacts/artifact.manager';
export * from './artifacts/artifact.types';
export * from './excellence/output-quality';
export * from './excellence/world-class-charter';
export * from './permissions/permission.service';
export * from './security/path-validator';
export * from './security/tool-permission.guard';
