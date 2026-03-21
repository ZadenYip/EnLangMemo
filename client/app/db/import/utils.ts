/**
 * Converts a snake_case string to camelCase.
 * @param str a snake_case string
 * @returns a camelCase string
 */
export function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts keys from snake_case to camelCase recursively.
 * @param obj an object or array to recursively convert keys from snake_case to camelCase
 * @returns the object or array with camelCase keys
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertKeysToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(convertKeysToCamelCase);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const camelKey = toCamelCase(key);
            acc[camelKey] = convertKeysToCamelCase(value); // 递归处理子对象
            return acc;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {} as Record<string, any>);
    }
    // if it's a basic type (string, number, boolean, null, undefined), return as is
    return obj;
}

/**
 * Converts a standard UUID string to a 16-byte buffer.
 * @param uuid - a standard UUID string (e.g., '123e4567-e89b-12d3-a456-426614174000')
 * @returns - a 16-byte buffer representing the UUID
 */
export function uuidToBuffer(uuid: string): Buffer {
    return Buffer.from(uuid.replaceAll('-', ''), 'hex');
}

/**
 * Converts a hexadecimal string to a bytes buffer.
 * @param value - sha256 fingerprint
 * @returns bytes buffer
 */
export function hexToBuffer(value: string): Buffer {
    return Buffer.from(value, 'hex');
}

/**
 * Converts a bytes buffer to a hexadecimal string.
 * @param value - sha256 fingerprint buffer
 * @returns hexadecimal string
 */
export function bufferToHex(value: Buffer): string {
    return value.toString('hex');
}