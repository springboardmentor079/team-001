import 'dotenv/config';
process.env.NODE_ENV = 'test';
const url = new URL(process.env.DATABASE_URL!);
url.pathname = '/buildtrack_test';
process.env.DATABASE_URL = url.toString();
process.env.MAIL_PROVIDER = 'local';
