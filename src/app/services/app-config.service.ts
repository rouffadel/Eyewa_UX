import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: any;

  constructor(private http: HttpClient) {}

  loadConfig(env: string = 'dev'): Promise<any> {
    const file = env === 'prod' ? 'appsettings.prod.json' : 'appsettings.json';
    // Bust browser/CDN cache so config always comes from the server after deploy.
    return this.http
      .get(`/config/${file}`, { params: { v: Date.now().toString() } })
      .toPromise()
      .then((config) => {
        this.config = config;
      });
  }

  get settings() {
    return this.config;
  }
}
