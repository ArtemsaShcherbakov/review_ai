import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpService } from '../http/http.service';

import { type IAiReview } from '../types/openroute.type';

interface IBody<T> {
  apiKey: string;
  model: string;
  messages: T[];
  httpReferer?: string;
  appTitle?: string;
}

@Injectable()
export class OpenrouterService {
  private url;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.url = this.configService.get<string>('OPENROUTER') || '';
  }

  private createBody<T>({
    apiKey,
    model,
    messages,
    httpReferer = '',
    appTitle = '',
  }: IBody<T>) {
    return {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': httpReferer,
        'X-OpenRouter-Title': appTitle,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
    };
  }

  async sendInModel<T>({
    apiKey,
    model,
    messages,
  }: {
    apiKey: string;
    model: string;
    messages: T[];
  }): Promise<IAiReview | string | null> {
    const body = this.createBody({
      apiKey,
      model,
      messages,
    });

    try {
      const response: IAiReview | null = await this.httpService.fetchData(
        this.url,
        body,
      );

      return response;
    } catch (error) {
      console.error(error);

      return null;
    }
  }
}
