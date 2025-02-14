export * from './config.service';
import { ConfigService } from './config.service';
export * from './config.serviceInterface';
export * from './schema.service';
import { SchemaService } from './schema.service';
export * from './schema.serviceInterface';
export const APIS = [ConfigService, SchemaService];
