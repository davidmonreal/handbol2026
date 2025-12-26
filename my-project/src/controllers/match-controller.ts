import { Match } from '@prisma/client';
import { BaseController } from './base-controller';
import { MatchService } from '../services/match-service';

export class MatchController extends BaseController<Match> {
  constructor(service: MatchService) {
    super(service, 'Match');
  }
}
