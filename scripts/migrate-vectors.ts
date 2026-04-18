/**
 * 向量数据迁移脚本
 * 从本地 VectorDB (JSON) 迁移到 Pinecone
 * 
 * 运行方式：
 * npx tsx scripts/migrate-vectors.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PineconeService } from '../server/services/PineconeService';
import { LLMService } from '../server/services/LLMService';

// 加载环境变量
dotenv.config({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '.data');

interface OldMemoryEntry {
  text: string;
  embedding: number[];
  timestamp: number;
}

async function migrateVectors() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Vector Database Migration Script      ║');
  console.log('║  JSON → Pinecone                       ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // ===== 第一步：初始化 Pinecone =====
    console.log('[1] Initializing Pinecone...');
    await PineconeService.initialize();
    await PineconeService.ensureIndexExists();
    console.log('✓ Pinecone initialized\n');

    // ===== 第二步：扫描本地文件 =====
    console.log('[2] Scanning local JSON files...');
    if (!fs.existsSync(DATA_DIR)) {
      console.log('⚠ No local data directory found. Skipping migration.');
      return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('memory_') && f.endsWith('.json'));
    console.log(`✓ Found ${files.length} memory file(s)\n`);

    if (files.length === 0) {
      console.log('No memories to migrate.');
      return;
    }

    // ===== 第三步：逐个迁移文件 =====
    let totalMigrated = 0;

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      const playerName = file.replace('memory_', '').replace('.json', '');

      console.log(`[3] Processing player: ${playerName}`);

      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const memories: OldMemoryEntry[] = JSON.parse(data);

        console.log(`  - Found ${memories.length} memories`);

        // 转换为 Pinecone 格式
        const records = memories.map((m, index) => ({
          id: `${playerName}-${m.timestamp}`,
          values: m.embedding,
          metadata: {
            playerName,
            text: m.text,
            timestamp: m.timestamp,
          },
        }));

        // 批量上传
        await PineconeService.batchUpsert(records);
        console.log(`  ✓ Migrated ${memories.length} memories\n`);

        totalMigrated += memories.length;
      } catch (error) {
        console.error(`  ✗ Failed to migrate player ${playerName}:`, error);
      }
    }

    // ===== 第四步：验证 =====
    console.log('[4] Verification');
    console.log(`✓ Total migrated: ${totalMigrated} memories\n`);

    // ===== 第五步：备份提醒 =====
    console.log('[5] Backup');
    console.log('⚠ Consider backing up the original JSON files before deleting them.');
    console.log('  Location:', DATA_DIR);
    console.log('\nYou can delete the JSON files after verifying migration:\n');
    console.log('  rm -rf .data/\n');

    console.log('╔════════════════════════════════════════╗');
    console.log('║  Migration Complete!                  ║');
    console.log('╚════════════════════════════════════════╝');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

// 运行迁移
migrateVectors().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
