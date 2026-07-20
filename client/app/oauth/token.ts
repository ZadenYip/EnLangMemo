// https://datatracker.ietf.org/doc/html/rfc6749#section-5.1
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

// https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
export interface TokenErrorResponse {
    error: string;
    error_description?: string;
}