import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = new URL('mysql://localhost');
databaseUrl.hostname = process.env.DB_HOST ?? '127.0.0.1';
databaseUrl.port = process.env.DB_PORT ?? '3306';
databaseUrl.username = process.env.DB_USER ?? '';
databaseUrl.password = process.env.DB_PASSWORD ?? '';
databaseUrl.pathname = `/${process.env.DB_NAME ?? 'maxhackathon'}`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: databaseUrl.toString() },
});
