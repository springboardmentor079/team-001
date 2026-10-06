import { app } from './app';
import { env } from './config/env';
import { db } from './shared/db';
const server = app.listen(env.PORT, env.HOST, () =>
  console.log(`BuildTrack API listening on http://127.0.0.1:${env.PORT}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(() => {
      void db.$disconnect().then(() => process.exit(0));
    });
  });
