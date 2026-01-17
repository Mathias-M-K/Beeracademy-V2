import { Injectable } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  environment: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private get config(): AppConfig {
    return (window as any).APP_CONFIG;
  }

  get apiUrl(): string {
    return this.config?.apiUrl || '';
  }

  get environment(): string {
    return this.config?.environment || '';
  }
}
