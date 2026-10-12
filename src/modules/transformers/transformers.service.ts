import { Injectable } from '@nestjs/common';

import { AutoTokenizer } from '@huggingface/transformers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TransformersService {
  constructor(private readonly configService: ConfigService) {}

  getCountTokens = async (codeText: string): Promise<number | null> => {
    try {
      //const modelName = this.configService.get<string>('MODEL');

      const tokenizer = await AutoTokenizer.from_pretrained(
        'nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16',
      );
      const tokens = tokenizer.encode(codeText);

      return tokens.length;
    } catch (error) {
      console.error(error);

      return null;
    }
  };
}
