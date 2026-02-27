export interface NinjaOneConfig {
  clientId: string;
  clientSecret: string;
  instance: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class NinjaOneClient {
  private baseUrl: string;
  private tokenUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private config: NinjaOneConfig) {
    this.baseUrl = `https://${config.instance}/v2`;
    this.tokenUrl = `https://${config.instance}/ws/oauth/token`;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: "monitoring management control offline_access",
    });

    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NinjaOne OAuth error (${response.status}): ${errorText}`,
      );
    }

    const token = (await response.json()) as TokenResponse;
    this.accessToken = token.access_token;
    this.tokenExpiresAt = now + token.expires_in * 1000;
    return this.accessToken;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<unknown> {
    const token = await this.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NinjaOne API error (${response.status}): ${errorText}`,
      );
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  async get(
    path: string,
    params?: Record<string, string>,
  ): Promise<unknown> {
    return this.request("GET", path, undefined, params);
  }

  async post(
    path: string,
    data?: Record<string, unknown>,
    params?: Record<string, string>,
  ): Promise<unknown> {
    return this.request("POST", path, data, params);
  }

  async put(
    path: string,
    data?: Record<string, unknown>,
    params?: Record<string, string>,
  ): Promise<unknown> {
    return this.request("PUT", path, data, params);
  }

  async patch(
    path: string,
    data?: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request("PATCH", path, data);
  }

  async delete(
    path: string,
    params?: Record<string, string>,
  ): Promise<unknown> {
    return this.request("DELETE", path, undefined, params);
  }
}
