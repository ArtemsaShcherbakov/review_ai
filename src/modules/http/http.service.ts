import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpService {
  async fetchData<T>(url: string, option?: any): Promise<T | null> {
    try {
      const response = await fetch(url, option);
      const data = await response.json();

      return response.ok ? data : null;
    } catch (error) {
      console.error(error);

      return null;
    }
  }
}
