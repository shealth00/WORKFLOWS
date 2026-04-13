#!/usr/bin/env node
/**
 * Writes PROJECT_MAP.md and WORKFLOWS-project-source.zip (excludes vendor/build/cache noise).
 * Run: node scripts/generate-project-map-and-zip.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const ZIP_NAME = 'WORKFLOWS-project-source.zip';

function shouldSkipPath(relPosix) {
  const parts = relPosix.split('/');
  if (parts.includes('node_modules')) return true;
  if (parts.includes('.git')) return true;
  if (parts.some((p) => p === 'dist' || p === 'build' || p === 'coverage')) return true;
  if (parts.includes('.gradle')) return true;
  if (parts.includes('.cache-gh')) return true;
  if (relPosix.endsWith('.DS_Store')) return true;
  if (relPosix === ZIP_NAME || relPosix.endsWith('/' + ZIP_NAME)) return true;
  return false;
}

/** All files under root as posix relative paths */
function collectFiles(relDir = '') {
  const abs = relDir ? path.join(root, relDir) : root;
  const relPosix = relDir.split(path.sep).join('/');
  if (relPosix && shouldSkipPath(relPosix)) return [];

  const st = fs.statSync(abs);
  if (!st.isDirectory()) {
    return shouldSkipPath(relPosix) ? [] : [relPosix || '.'];
  }

  const out = [];
  for (const name of fs.readdirSync(abs)) {
    if (name === '.git') continue;
    const childRel = relDir ? `${relDir}/${name}` : name;
    const childPosix = childRel.split(path.sep).join('/');
    if (shouldSkipPath(childPosix)) continue;
    out.push(...collectFiles(childRel));
  }
  return out;
}

function addToTree(tree, parts) {
  let cur = tree;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const last = i === parts.length - 1;
    if (last) {
      cur.__files = cur.__files || [];
      cur.__files.push(part);
    } else {
      cur[part] = cur[part] || {};
      cur = cur[part];
    }
  }
}

function printTree(node, prefix = '') {
  const dirs = Object.keys(node).filter((k) => !k.startsWith('__'));
  dirs.sort((a, b) => a.localeCompare(b));
  const files = node.__files || [];
  files.sort((a, b) => a.localeCompare(b));

  const lines = [];
  const entries = [
    ...dirs.map((d) => ({ type: 'dir', name: d })),
    ...files.map((f) => ({ type: 'file', name: f })),
  ];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const last = i === entries.length - 1;
    const branch = last ? '└── ' : '├── ';
    const childPrefix = last ? '    ' : '│   ';

    if (e.type === 'dir') {
      lines.push(prefix + branch + '📁 ' + e.name + '/');
      lines.push(...printTree(node[e.name], prefix + childPrefix));
    } else {
      lines.push(prefix + branch + '📄 ' + e.name);
    }
  }
  return lines;
}

const files = collectFiles()
  .filter((f) => f && f !== '.')
  .sort();

const treeRoot = {};
for (const f of files) {
  const parts = f.split('/').filter(Boolean);
  addToTree(treeRoot, parts);
}

const treeBody = printTree(treeRoot).join('\n');
const header = `# WORKFLOWS project map

Generated: **${new Date().toISOString().slice(0, 19)}Z**

Companion archive: **${ZIP_NAME}** (same inclusion rules as this map).

**Excluded** from the map and ZIP: \`node_modules/\`, \`.git/\`, \`dist/\`, \`build/\`, \`coverage/\`, \`.gradle/\` (Android cache), \`.cache-gh/\`, \`.DS_Store\`, and this zip file.

---

## Directory tree

\`\`\`
WORKFLOWS-main/
${treeBody}
\`\`\`

---

## Flat file index (${files.length} files)

`;

const flat = files.map((f) => `- \`${f}\``).join('\n');
const outMd = path.join(root, 'PROJECT_MAP.md');
fs.writeFileSync(outMd, header + flat + '\n', 'utf8');
console.log('Wrote PROJECT_MAP.md', `(${files.length} files)`);

const zipPath = path.join(root, ZIP_NAME);
try {
  fs.unlinkSync(zipPath);
} catch {
  /* */
}

const zipFiles = [...new Set([...files, 'PROJECT_MAP.md'])].sort();
const input = zipFiles.join('\n') + '\n';

const r = spawnSync('zip', ['-q', ZIP_NAME, '-@'], {
  cwd: root,
  input,
  encoding: 'utf8',
});

if (r.status !== 0) {
  console.error(r.stderr || r.stdout || 'zip failed');
  process.exit(r.status ?? 1);
}

const st = fs.statSync(zipPath);
console.log('Wrote', ZIP_NAME, `(${(st.size / 1024 / 1024).toFixed(2)} MB)`);
