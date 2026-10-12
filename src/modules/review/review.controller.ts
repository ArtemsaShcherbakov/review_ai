import { Controller, Param, Get, Res, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { GitHubService } from '../github/github.service';
import { OpenrouterService } from '../openroute/openroute.service';
import { TransformersService } from '../transformers/transformers.service';
import { ChunkingService } from './chunking.service';

import { jsonParse } from '../../helpers/json-parse';

import { SYSTEM_PROMT, SUMMARY_PROMT } from './review.constants';

import type { IReview } from '../types/review.types';
import type { IFilesGitHub } from './chunking.types';
import type { IAiReview } from '../types/openroute.type';

@Controller()
export class ReviewController {
  constructor(
    private readonly gitHubService: GitHubService,
    private readonly openrouterService: OpenrouterService,
    private readonly transformersService: TransformersService,
    private readonly configService: ConfigService,
    private readonly chunkingService: ChunkingService,
  ) {}

  @Get('/review/:owner/:repository/:number')
  async reviewStart(@Param() params: any, @Res() res: Response) {
    const modelSetting = {
      apiKey: this.configService.get<string>('API_KEY_OPENROUTER') || '',
      model: this.configService.get<string>('MODEL') || '',
    };

    // Получение информации о pull request
    const pullRequest = await this.gitHubService.getPullRequestByNumber(params);

    if (!pullRequest) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ isError: true, textError: 'Не найден такой pull request' });
    }

    // Формирование масива данных, который будет отправлен в нейросеть
    const files: IFilesGitHub[] = pullRequest.map(({ filename, patch }) => ({
      filename,
      patch,
    }));

    // TODO: Сделать подсчет токенов. Что делат ьесли контекст переполнен.
    const codeText: string = JSON.stringify(files);

    const countTokens: number =
      (await this.transformersService.getCountTokens(codeText)) ?? 0;
    let aiSummary: IAiReview | string | null = '';
    let chunkList: string[] = [];

    // Контекст большой. Переходим в Chunking файлов
    if (countTokens > this.chunkingService.LIMIT_TOKENS) {
      chunkList = await Promise.all(
        files.map((file) => this.chunkingService.chunkingByHunks(file)),
      );

      console.log(chunkList);

      // 4 чанка * по 150.000 токенов = 600.000 токенов
      if (chunkList.length > this.chunkingService.CHUNK_MAX_LENGTH) {
        for (let chunk of chunkList) {
          aiSummary += await this.openrouterService.sendInModel({
            ...modelSetting,
            messages: [
              { role: 'system', content: SYSTEM_PROMT },
              {
                role: 'user',
                content: 'Вот код для summary:' + chunk,
              },
            ],
          });
        }
      }
    }

    const code = chunkList.length
      ? aiSummary
      : // Сразу делаем ревью
        codeText;
    const promt = chunkList.length ? SUMMARY_PROMT : SYSTEM_PROMT;
    const contentCode = chunkList.length
      ? `Вот summary pr/mr: ${code}`
      : `Вот код для ревью: ${code}`;

    const aiReview = await this.openrouterService.sendInModel({
      ...modelSetting,
      messages: [
        { role: 'system', content: promt },
        {
          role: 'user',
          content: contentCode,
        },
      ],
    });

    // TODO: Сделать подгрузку всего проекта (граф знанийи/выжимка по всему проекту/самари)
    if (!aiReview) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ isError: true, textError: 'Не удалось провести ревью' });
    }

    const content = (aiReview as IAiReview).choices[0].message.content;
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
