import { Module } from '@nestjs/common';
import { GitHubModule } from './modules/github/github.module';

@Module({
  imports: [GitHubModule],
})
export class AppModule {}
