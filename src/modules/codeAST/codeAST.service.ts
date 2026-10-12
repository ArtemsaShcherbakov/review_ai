import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Parser from 'web-tree-sitter';
import * as path from 'path';

@Injectable()
export class CodeAST implements OnModuleDestroy {
  private parser?: Parser;
  private initPromise?: Promise<Parser>;

  private async createParser(): Promise<Parser> {
    const webTreeSitterPath = path.dirname(require.resolve('web-tree-sitter'));

    await Parser.init({
      locateFile: (file: any) => path.join(webTreeSitterPath, file),
    });

    const parser = new Parser();

    const grammarPath = path.join(
      require.resolve('tree-sitter-wasms/package.json'),
      '..',
      'out',
      'tree-sitter-typescript.wasm',
    );

    const lang = await Parser.Language.load(grammarPath);
    parser.setLanguage(lang);

    return parser;
  }

  private async getParser(): Promise<Parser> {
    if (this.parser) {
      return this.parser;
    }

    this.initPromise ??= this.createParser();

    try {
      this.parser = await this.initPromise;
      return this.parser;
    } catch (error) {
      this.initPromise = undefined;
      throw error;
    }
  }

  async parseCode(code: string): Promise<string> {
    const parser = await this.getParser();

    parser.reset();
    const tree = parser.parse(code);

    return tree?.rootNode.toString() ?? '';
  }

  async parserCode(code: string): Promise<string> {
    return this.parseCode(code);
  }

  onModuleDestroy(): void {
    this.parser?.delete();
    this.parser = undefined;
    this.initPromise = undefined;
  }
}
