import {computed, inject, Service, Signal} from '@angular/core';
import {GameService} from '../game/game.service';
import {AchievementDetector, GameEvents} from './models/achievement-detector';
import {fastestChug} from './detectors/fastest-chug';
import {mostBeers} from './detectors/most-beers';
import {fastestAverageTurn} from './detectors/fastest-average-turn';
import {slowestChug} from './detectors/slowest-chug';
import {noChugs} from './detectors/no-chugs';

@Service()
export class AchievementService {

  private readonly gameService = inject(GameService);

  private readonly gameEvents: Signal<GameEvents> = computed(() => {
    return {turns: this.gameService.turns(), chugs: this.gameService.chugs()};
  });

  private readonly detectors: AchievementDetector[] = [fastestChug, slowestChug, mostBeers, fastestAverageTurn, noChugs];

  public readonly achievements = computed(() => {
    const gameEvents = this.gameEvents();

    return this.detectors.map(detector => detector(gameEvents)).filter(achievement => achievement !== undefined);
  });

}
