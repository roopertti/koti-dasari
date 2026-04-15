export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'INTERNAL_ERROR';
  };
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
}
