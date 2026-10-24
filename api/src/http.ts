export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message = 'Geçersiz istek') =>
  new HttpError(400, 'VALIDATION_ERROR', message);

export const notFound = (message = 'Kayıt bulunamadı') =>
  new HttpError(404, 'NOT_FOUND', message);
