const baseUrl = 'https://gaga.invalid/';
function normalized(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function isSafeUrl(value, allowedProtocols) {
    const input = normalized(value);
    if (!input)
        return false;
    try {
        const url = new URL(input, baseUrl);
        if (!allowedProtocols.includes(url.protocol))
            return false;
        if (url.username || url.password)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
export function isSafeMediaSource(value) {
    return isSafeUrl(value, ['https:', 'http:', 'blob:']);
}
export function isSafeMediaLink(value) {
    return isSafeUrl(value, ['https:', 'http:', 'mailto:']);
}
export function isSafeEmbedSource(value) {
    return isSafeUrl(value, ['https:', 'http:']);
}
//# sourceMappingURL=media-security.js.map