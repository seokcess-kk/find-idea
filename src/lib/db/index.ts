import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// 데이터 디렉토리 확인 및 생성
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ideation.db');
const sqlite = new Database(dbPath);

// WAL 모드 활성화 (성능 향상)
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export { schema };
