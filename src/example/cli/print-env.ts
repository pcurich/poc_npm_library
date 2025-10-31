import 'fake-indexeddb/auto';
import { printEnv } from '../../indexeddb/utils/env';
 

function parseArgs(argv: string[]) {
  const out: { prefix?: string; hide?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prefix' && argv[i + 1]) {
      out.prefix = argv[i + 1];
      i++;
    } else if (a === '--hide' || a === '--hide-values') {
      out.hide = true;
    }
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
printEnv({ prefix: opts.prefix, hideValues: !!opts.hide });