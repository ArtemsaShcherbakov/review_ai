import { Injectable, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpService } from '../http/http.service';

import { PullRequestListType } from '../types/gitHub.type';

interface IRepository {
  owner: string;
  repository: string;
  number: string;
}

@Injectable()
export class GitHubService {
  private url;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.url = this.configService.get<string>('GIT_HUB_API') || '';
  }

  async getRepositoryContents({
    owner,
    repository,
  }: Omit<IRepository, 'number'>): Promise<any> {
    try {
      const url = `${this.url}/repos/${owner}/${repository}`;

      const data = await this.httpService.fetchData(url);

      return data;
    } catch (error) {
      console.error(error);

      return null;
    }
  }

  async getPullRequestByNumber({
    owner,
    repository,
    number,
  }: IRepository): Promise<PullRequestListType | null> {
    try {
      const url = `${this.url}/repos/${owner}/${repository}/pulls/${number}/files`;

      const data: PullRequestListType | null =
        await this.httpService.fetchData(url);

      return data;
    } catch (error) {
      console.error(error);

      return null;
    }
  }
}
