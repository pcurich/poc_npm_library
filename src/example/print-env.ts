import 'fake-indexeddb/auto'; // opcional para tests en Node que usan indexedDB
import { printEnv } from '../indexeddb/utils/env';

 
// Imprime todas las variables (ocultando valores para seguridad)
printEnv({ hideValues: true });

// Imprime solo variables con prefijo VITE_ (ej. Vite)
printEnv({ prefix: 'VITE_', hideValues: false });