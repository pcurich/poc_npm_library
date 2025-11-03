import 'fake-indexeddb/auto';
import { listEnvVariables, printEnv } from '../indexeddb/utils/env';

function demo() {
  console.log('--- printEnv() (full) ---');
  printEnv();

  console.log('\n--- listEnvVariables() (programmatic) ---');
  const entries = listEnvVariables();
  for (const e of entries) {
    console.log(`${e.key} = ${String(e.value)}`);
  }
}

demo();