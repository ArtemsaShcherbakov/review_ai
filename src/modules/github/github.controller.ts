import { Controller, Get, HttpStatus, Res, Param } from '@nestjs/common';
import { GitHubService } from './github.service';
import { type Response } from 'express';

@Controller()
export class GitHubController {
  private readonly url: string = 'https://api.github.com';

  constructor(private readonly gitHubService: GitHubService) {}

  @Get('/users')
  async getUsers(@Res() res: Response): Promise<any> {
    const url = `${this.url}/users`;

    const users = await this.gitHubService.fetchData(url);

    return res.status(HttpStatus.OK).json(users);
  }

  @Get('/repository/:owner/:repository')
  async getRepositoryContents(
    @Param() param: any,
    @Res() res: Response,
  ): Promise<any> {
    const { owner, repository } = param;

    const url = `${this.url}/repos/${owner}/${repository}`;

    const data = await this.gitHubService.fetchData(url);

    return res.status(HttpStatus.OK).json(repository);
  }

  @Get('/pullRequests/:owner/:repository/:number')
  async getPullRequestByNumber(@Param() param: any, @Res() res: Response) {
    const { owner, repository, number } = param;

    const url = `${this.url}/repos/${owner}/${repository}/pulls/${number}/files`;

    const data = await this.gitHubService.fetchData(url);

    return res.status(HttpStatus.OK).json(data);
  }
}
