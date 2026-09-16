import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IsPlayerDirective } from './is-player.directive';
import { GameService } from '../services/game/game.service';

@Component({
  imports: [IsPlayerDirective],
  template: `<p *isPlayer>Player controls</p>`,
})
class HostComponent {}

describe('IsPlayerDirective', () => {
  let isPlayer: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    isPlayer = signal(false);
    TestBed.configureTestingModule({
      providers: [{ provide: GameService, useValue: { isPlayer } }],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('renders its content for players', async () => {
    // Arrange
    isPlayer.set(true);

    // Act
    const fixture = await render();

    // Assert
    expect(fixture.nativeElement.textContent).toContain('Player controls');
  });

  it('hides its content from the game client', async () => {
    // Arrange
    isPlayer.set(false);

    // Act
    const fixture = await render();

    // Assert
    expect(fixture.nativeElement.textContent).not.toContain('Player controls');
  });

  it('shows its content once the client is identified as a player', async () => {
    // Arrange
    const fixture = await render();

    // Act
    isPlayer.set(true);
    await fixture.whenStable();

    // Assert
    expect(fixture.nativeElement.querySelectorAll('p')).toHaveLength(1);
  });

  it('removes its content when the client stops being a player', async () => {
    // Arrange
    isPlayer.set(true);
    const fixture = await render();

    // Act
    isPlayer.set(false);
    await fixture.whenStable();

    // Assert
    expect(fixture.nativeElement.querySelectorAll('p')).toHaveLength(0);
  });
});
