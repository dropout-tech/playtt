export const PUBLIC_CONTENT_EXTENSION = /\.(?:css|js|mjs|json|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|mp3|mp4|ogg|wav|webm|pdf|txt|xml)$/i;

export function wordPressContentType(path: string): string {
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase()
  return ({
    avif: "image/avif",
    css: "text/css; charset=utf-8",
    eot: "application/vnd.ms-fontobject",
    gif: "image/gif",
    ico: "image/x-icon",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    json: "application/json",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    ogg: "audio/ogg",
    otf: "font/otf",
    pdf: "application/pdf",
    png: "image/png",
    svg: "image/svg+xml",
    txt: "text/plain; charset=utf-8",
    ttf: "font/ttf",
    wav: "audio/wav",
    webm: "video/webm",
    webp: "image/webp",
    woff: "font/woff",
    woff2: "font/woff2",
    xml: "application/xml",
  } as Record<string, string>)[extension] ?? "application/octet-stream"
}
