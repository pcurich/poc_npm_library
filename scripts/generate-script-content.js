import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rutas
const scriptSourcePath = path.resolve(__dirname, '../src/indexeddb/scripts/http-mock-manager.js');
const outputPath = path.resolve(__dirname, '../src/indexeddb/utils/http-mock-manager-script.ts');

console.log('📦 Generando archivo de contenido del script...');

try {
  // Leer el contenido del script
  const scriptContent = fs.readFileSync(scriptSourcePath, 'utf-8');
  
  console.log(`✅ Script leído: ${scriptContent.length} caracteres`);
  
  // Generar el archivo TypeScript con el contenido inline
// Usamos una función getter para forzar a Rollup a mantener la variable
    const outputContent = `/**
 * HTTP Mock Manager Script Content
 * 
 * Este archivo es generado automáticamente por scripts/generate-script-content.js
 * NO EDITAR MANUALMENTE - Los cambios se perderán en el próximo build
 * 
 * Contenido original: src/indexeddb/scripts/http-mock-manager.js
 */

const _HTTP_MOCK_MANAGER_SCRIPT_CONTENT = ${JSON.stringify(scriptContent)};

// Export como getter para evitar tree-shaking
export const HTTP_MOCK_MANAGER_SCRIPT = _HTTP_MOCK_MANAGER_SCRIPT_CONTENT;
`;

  // Escribir el archivo
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  
  console.log(`✅ Archivo generado: ${outputPath}`);
  console.log(`✅ Contenido exportado: ${scriptContent.length} caracteres`);
  console.log('✅ ¡Generación completada exitosamente!');
  
} catch (error) {
  console.error('❌ Error generando el archivo:', error.message);
  process.exit(1);
}
