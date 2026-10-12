import { Injectable } from '@nestjs/common';

import { TransformersService } from '../transformers/transformers.service';
import { CodeAST } from '../codeAST/codeAST.service';

import type { IFilesGitHub } from './chunking.types';

/**
 * 1. Для каждого файла из diff:
   a. Если файл generated/vendor/lock/binary → skip
   b. Собрать все хунки файла
   
2. Для файла:
   a. Если сумма токенов хунков < LIMIT_CHUNK (например 120k):
      → один чанк, все хунки вместе
   b. Иначе:
      → жадно группируем хунки в чанки по LIMIT_CHUNK
      → если отдельный хунк > LIMIT_CHUNK:
          → режем его tree-sitter'ом по функциям/классам
          → каждая часть становится отдельным чанком

3. Для каждого чанка добавляем:
   - header: imports, top-level declarations
   - cross-refs: сигнатуры символов, определённых в других чанках
     этого же файла (если есть tree-sitter)
   - метаданные: file, hunk_ids, symbols

4. Опционально: overlap
   - только по целым функциям/хункам на границе
   - не более 10–15% от размера чанка
 */
@Injectable()
export class ChunkingService {
  public readonly LIMIT_TOKENS = 600000;
  public readonly LIMIT_CHUNK_TOKENS = 150000;
  public readonly CHUNK_MAX_LENGTH = 4;

  constructor(
    private readonly transformersService: TransformersService,
    private readonly codeAst: CodeAST,
  ) {}

  /**
   * Достаёт из patch "чистый" код без diff-разметки.
   * Оставляет только добавленные строки (те, что начинаются с "+").
   */
  private extractCodeFromPatch(patch: string): string {
    return patch
      .replaceAll('@@', '')
      .replaceAll('diff --git', '')
      .replaceAll('index ', '')
      .replaceAll('--- ', '')
      .replaceAll('+++ ', '')
      .replaceAll('\\ No newline', '')
      .replaceAll('\n+', '');
  }

  private getHunksFileText(file: string): {
    extractCode: string;
    hunksListFile: string;
  } {
    // Разбиение на хунки [fileName, hunk, code]
    const hunks = file.split('@@');

    hunks.shift();

    let hunksListFile = '';
    let extractCode = '';

    // Формирования списка хунков и текста кода
    for (let i = 0; i < hunks.length; i += 2) {
      const code = this.extractCodeFromPatch(hunks[i + 1]);

      const hunk = hunks[i];
      extractCode += code;
      hunksListFile += `${hunk} | ${extractCode}`;
    }

    return { extractCode: extractCode, hunksListFile };
  }

  async chunkingByHunks(file: IFilesGitHub): Promise<string> {
    const { extractCode, hunksListFile } = this.getHunksFileText(file.patch);

    const countTokens =
      (await this.transformersService.getCountTokens(hunksListFile)) ?? 0;

    if (countTokens > this.LIMIT_CHUNK_TOKENS) {
      const code = await this.codeAst.parserCode(extractCode);

      // TODO: Сделать обработку если code больше LIMIT_CHUNK_TOKENS
      return `Файл: ${file.filename}; Код: ${code}`;
    }

    return `Файл: ${file.filename} Код: ${hunksListFile}`;
  }
}
