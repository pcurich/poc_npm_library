import fs from 'fs/promises';
import path from 'path';

const OUT = process.argv[2] || process.env.BUILD_OUT || 'lib';
const ROOT = path.resolve(OUT);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else if (e.isFile() && full.endsWith('.js')) await fixFile(full);
  }
}

async function fixFile(file) {
  let s = await fs.readFile(file, 'utf8');

  // add .js to relative imports/exports that lack an extension
  s = s.replace(
    /((?:import|export)\s+(?:[^'"]*?\s+from\s+)?)(['"])(\.\.?\/[^'"]+?)(['"])/g,
    (m, pfx, q1, rel, q2) => {
      if (/[.][a-zA-Z0-9]+$/.test(rel) || rel.endsWith('/') || rel.includes('?')) return `${pfx}${q1}${rel}${q2}`;
      return `${pfx}${q1}${rel}.js${q2}`;
    }
  );

  // handle dynamic import('...') cases
  s = s.replace(
    /import\(\s*(['"])(\.\.?\/[^'")]+?)(['"])\s*\)/g,
    (m, q1, rel, q2) => {
      if (/[.][a-zA-Z0-9]+$/.test(rel) || rel.endsWith('/') || rel.includes('?')) return m;
      return `import(${q1}${rel}.js${q2})`;
    }
  );

  await fs.writeFile(file, s, 'utf8');
}

(async () => {
  try {
    await walk(ROOT);
    console.log('fix-import-extensions: done for', ROOT);
  } catch (err) {
    console.error('fix-import-extensions: error', err);
    process.exit(1);
  }
})();