import { Controller, Param, Get, Res, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { GitHubService } from '../github/github.service';
import { OpenrouterService } from '../openroute/openroute.service';

import { jsonParse } from 'src/helpers/json-parse';

import { SYSTEM_PROMT } from './review.constants';

import type { IReview } from '../types/review.types';

@Controller()
export class ReviewController {
  constructor(
    private readonly gitHubService: GitHubService,
    private readonly openrouterService: OpenrouterService,
    private configService: ConfigService,
  ) {}

  @Get('/review/:owner/:repository/:number')
  async reviewStart(@Param() params: any, @Res() res: Response) {
    // Получение информации о pull request
    const pullRequest = await this.gitHubService.getPullRequestByNumber(params);

    if (!pullRequest) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ isError: true, textError: 'Не найден такой pull request' });
    }

    // Формирование масива данных, который будет отправлен в нейросеть
    const code = pullRequest.map(({ filename, status, patch, raw_url }) => ({
      filename,
      status,
      patch,
      raw_url,
    }));

    // TODO: Сделать подсчет токенов. Что делат ьесли контекст переполнен.
    // TODO: Сделать подгрузку всего проекта (граф знанийи/выжимка по всему проекту/самари)

    // Отправка данных в нейросеть, через openrouter
    const aiReview = await this.openrouterService.sendInModel(
      this.configService.get<string>('API_KEY_OPENROUTER') || '',
      this.configService.get<string>('MODEL') || '',
      [
        { role: 'system', content: SYSTEM_PROMT },
        {
          role: 'user',
          content: 'Вот код для ревью:' + JSON.stringify(code),
        },
      ],
    );

    if (!aiReview) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ isError: true, textError: 'Не удалось провести ревью' });
    }

    const content = aiReview.choices[0].message.content;
    const comments = jsonParse<IReview[] | null>(content);

    // Получение последнего коммита в pull request
    const commitId = await this.gitHubService.getLastCommitSha(params);

    if (!commitId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        isError: true,
        textError: 'Не удалось получить последний коммит',
      });
    }

    // Создание комментариев в pull request
    comments?.forEach((review) =>
      this.gitHubService.createCommentForPullRequest(
        params,
        review as IReview,
        commitId,
      ),
    );

    return res.status(HttpStatus.OK).json({ isError: false, comments });
  }
}
