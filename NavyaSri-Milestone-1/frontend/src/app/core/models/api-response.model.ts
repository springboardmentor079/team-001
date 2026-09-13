/** Mirrors the backend's standard {success, message, data} envelope. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}
