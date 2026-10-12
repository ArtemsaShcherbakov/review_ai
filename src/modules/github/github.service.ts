import { Injectable, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpService } from '../http/http.service';

import type { IReview } from '../types/review.types';
import type { PullRequestListType } from '../types/gitHub.type';

interface IRepository {
  owner: string;
  repository: string;
  number: string;
}

@Injectable()
export class GitHubService {
  private url;
  private headers;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.url = this.configService.get<string>('GIT_HUB_API') || '';
    this.headers = {
      Authorization: `Bearer ${this.configService.get<string>('GIT_HUB_TOKEN')}`,
    };
  }

  async getRepositoryContents({
    owner,
    repository,
  }: Omit<IRepository, 'number'>): Promise<any> {
    try {
      const url = `${this.url}/repos/${owner}/${repository}`;

      const data = await this.httpService.fetchData(url, this.headers);

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

      const data: PullRequestListType | null = await this.httpService.fetchData(
        url,
        this.headers,
      );

      return data;
    } catch (error) {
      console.error(error);

      return null;
    }
  }

  async getLastCommitSha({
    owner,
    repository,
    number,
  }: IRepository): Promise<string> {
    try {
      const url = `${this.url}/repos/${owner}/${repository}/pulls/${number}/commits`;

      const commits: PullRequestListType | null =
        await this.httpService.fetchData(url, this.headers);

      // Последний коммит — последний элемент массива
      const lastCommit = commits?.at(-1);

      return lastCommit?.sha || '';
    } catch (error) {
      console.error(error);

      return '';
    }
  }

  async createCommentForPullRequest(
    { owner, repository, number }: IRepository,
    { fileName, comment, line, severity, category, title }: IReview,
    commitId: string,
  ) {
    try {
      const url = `${this.url}/repos/${owner}/${repository}/pulls/${number}/comments`;
      const message = `${title} \n ${severity} | ${category} \n ${comment}`;

      return await this.httpService.fetchData(url, {
        method: 'POST',
        body: JSON.stringify({
          body: message,
          commit_id: commitId,
          path: fileName,
          start_side: 'RIGHT',
          line: line,
          side: 'RIGHT',
        }),
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('GIT_HUB_TOKEN')}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
    } catch (error) {
      console.error(error);

      return null;
    }
  }
}
