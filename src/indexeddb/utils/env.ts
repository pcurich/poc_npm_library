export type EnvMap = Record<string, string | undefined>;

/**
 * Devuelve un map con variables de entorno detectadas:
 * - Node: process.env
 * - Runtime expuesto: globalThis.__ENV
 * - Bundlers (build-time): import.meta.env (intento de lectura segura)
 */
export function getEnvMap(): EnvMap {
    if (typeof process !== 'undefined' && (process as any).env) {
        return { ...(process as any).env } as EnvMap;
    }
    if ((globalThis as any).__ENV && typeof (globalThis as any).__ENV === 'object') {
        return { ...(globalThis as any).__ENV } as EnvMap;
    }
    try {
        const meta: any = (typeof import.meta !== 'undefined') ? (import.meta as any) : undefined;
        if (meta && meta.env && typeof meta.env === 'object') {
            const out: EnvMap = {};
            for (const k of Object.keys(meta.env)) {
                out[k] = meta.env[k] === undefined ? undefined : String(meta.env[k]);
            }
            return out;
        }
    } catch {
        /* no import.meta disponible */
    }
    return {};
}

export function printEnv(options?: { prefix?: string; hideValues?: boolean }): void {
    const { prefix, hideValues } = { prefix: undefined, hideValues: false, ...(options || {}) };
    const env = getEnvMap();
    const keys = Object.keys(env).sort();

    console.groupCollapsed ? console.groupCollapsed('Environment variables') : console.group('Environment variables');
    if (keys.length === 0) {
        console.info('(no environment variables found)');
    } else {
        for (const k of keys) {
            if (prefix && !k.startsWith(prefix)) continue;
            const v = env[k];
            if (hideValues && v) {
                const preview = v.length > 8 ? `${v.slice(0, 4)}...${v.slice(-4)}` : v;
                console.log(`${k} = <hidden> (preview: ${preview}, len=${v.length})`);
            } else {
                console.log(`${k} = ${String(v)}`);
            }
        }
    }
    console.groupEnd ? console.groupEnd() : undefined;
}

/**
 * Devuelve una lista ordenada con todas las variables de entorno detectadas.
 * Cada entrada tiene { key, value }.
 */
export function listEnvVariables(): Array<{ key: string; value: string | undefined }> {
    const map = getEnvMap();
    return Object.keys(map)
        .sort()
        .map((k) => ({ key: k, value: map[k] }));
}