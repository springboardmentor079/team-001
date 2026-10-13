import { HttpResponse } from '@angular/common/http';

/** Save a blob response as a file, using the server-provided filename when present. */
export function saveBlobResponse(res: HttpResponse<Blob>, fallbackName: string): void {
  const header = res.headers.get('Content-Disposition') || '';
  const match = /filename="?([^";]+)"?/i.exec(header);
  saveBlob(res.body as Blob, match ? match[1] : fallbackName);
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
