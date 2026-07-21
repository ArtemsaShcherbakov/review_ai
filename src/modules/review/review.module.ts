import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { HttpService } from '../http/http.service';
import { GitHubService } from '../github/github.service';
import { OpenrouterService } from '../openroute/openroute.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ReviewController],
  providers: [HttpService, GitHubService, OpenrouterService],
  exports: [HttpService],
})
export class ReviewModule {}
