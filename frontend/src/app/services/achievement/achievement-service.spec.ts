import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AchievementService } from './achievement-service';
import { GameService } from '../game/game.service';
import { Player } from '../game/models/player';
import { PlayerTurn } from '../game/models/playerTurn';
import { PlayerChug } from '../game/models/playerChug';
import { aCard, aPlayerDto, PLAYER_1, PLAYER_2 } from '../../../testing/game-builders';

describe('AchievementService', () => {
  const anna = Player.fromPlayerDto(aPlayerDto({ id: PLAYER_1, name: 'Anna' }));
  const bo = Player.fromPlayerDto(aPlayerDto({ id: PLAYER_2, name: 'Bo' }));

  let turns: ReturnType<typeof signal<PlayerTurn[]>>;
  let chugs: ReturnType<typeof signal<PlayerChug[]>>;
  let service: AchievementService;

  beforeEach(() => {
    turns = signal<PlayerTurn[]>([]);
    chugs = signal<PlayerChug[]>([]);
    TestBed.configureTestingModule({
      providers: [{ provide: GameService, useValue: { turns, chugs } }],
    });
    service = TestBed.inject(AchievementService);
  });

  function playSampleGame() {
    turns.set([
      { player: anna, info: { round: 2, card: aCard(14), durationInMillis: 2_000 } },
      { player: bo, info: { round: 2, card: aCard(5), durationInMillis: 3_000 } },
    ]);
    chugs.set([{ player: anna, chug: { chugTimeMillis: 1_500 }, placement: 1, chugNumber: 1 }]);
  }

  it('awards nothing before any card has been drawn', () => {
    // Act
    const achievements = service.achievements();

    // Assert
    expect(achievements).toEqual([]);
  });

  it('lists only the awards that apply, in detector order', () => {
    // Arrange
    playSampleGame();

    // Act
    const titles = service.achievements().map((achievement) => achievement.title);

    // Assert
    expect(titles).toEqual([
      'Hurtigste bunde-tid',
      'Langsomste bunde-tid',
      'Flest øl',
      'Hurtigste snit-tid',
      'Ingen bundere',
    ]);
  });

  it('groups the awards by the player who won them', () => {
    // Arrange
    playSampleGame();

    // Act
    const byPlayer = service.achievementsByPlayer();

    // Assert
    expect(byPlayer.get(PLAYER_1)?.map((achievement) => achievement.title)).toEqual([
      'Hurtigste bunde-tid',
      'Langsomste bunde-tid',
      'Flest øl',
      'Hurtigste snit-tid',
    ]);
    expect(byPlayer.get(PLAYER_2)?.map((achievement) => achievement.title)).toEqual([
      'Ingen bundere',
    ]);
  });
});
