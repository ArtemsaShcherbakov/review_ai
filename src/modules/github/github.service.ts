import { Injectable } from '@nestjs/common';

@Injectable()
export class GitHubService {
  async fetchData<T>(url: string): Promise<T | null> {
    const response = await fetch(url);

    return response.ok ? await response.json() : null;
  }
}
