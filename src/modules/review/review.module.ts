import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { HttpService } from '../http/http.service';
import { GitHubService } from '../github/github.service';
import { TransformersService } from '../transformers/transformers.service';
import { OpenrouterService } from '../openroute/openroute.service';
import { ChunkingService } from './chunking.service';
import { CodeAST } from '../codeAST/codeAST.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ReviewController],
  providers: [
    HttpService,
    GitHubService,
    OpenrouterService,
    TransformersService,
    ChunkingService,
    CodeAST,
  ],
  exports: [HttpService],
})
export class ReviewModule {}
