import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { deploymentIdentity } from './deployment-identity.mjs';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(
  await readFile(resolve(root, 'aleph.config.json'), 'utf8'),
);

if (![1, 2].includes(config.step)) {
  throw new Error('현재 빌드는 1단계 또는 2단계 설정만 지원합니다.');
}

await mkdir(resolve(root, 'public'), { recursive: true });

if (config.step === 1) {
  const source = resolve(root, 'data.json');
  const output = resolve(root, 'public', 'data.json');
  const data = JSON.parse(await readFile(source, 'utf8'));

  if (!Array.isArray(data.notes)) {
    throw new Error('실습용 공개 자료 형식을 확인하세요.');
  }

  await copyFile(source, output);
} else {
  await writeFile(
    resolve(root, 'public', 'data.json'),
    `${JSON.stringify({ notes: [] }, null, 2)}\n`,
    'utf8',
  );
}

if (!process.argv.includes('--local')) {
  const identity = deploymentIdentity(process.env, config);

  await writeFile(
    resolve(root, 'public', 'aleph.json'),
    `${JSON.stringify(identity, null, 2)}\n`,
    'utf8',
  );
}

console.log(`BYTE BACK ${config.step}단계 정적 결과물을 준비했습니다.`);
