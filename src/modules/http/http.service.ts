import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpService {
  async fetchData<T>(url: string, body?: any): Promise<T | null> {
    try {
      const response = await fetch(url, body);

      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error(error);

      return null;
    }
  }
}
