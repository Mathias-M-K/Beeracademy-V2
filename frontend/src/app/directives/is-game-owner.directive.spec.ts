import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IsGameOwnerDirective } from './is-game-owner.directive';
import { GameService } from '../services/game/game.service';

@Component({
  imports: [IsGameOwnerDirective],
  template: `<p *isGameOwner>Owner controls</p>`,
})
class HostComponent {}

describe('IsGameOwnerDirective', () => {
  let isGameClient: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    isGameClient = signal(false);
    TestBed.configureTestingModule({
      providers: [{ provide: GameService, useValue: { isGameClient } }],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('renders its content for the game client', async () => {
    // Arrange
    isGameClient.set(true);

    // Act
    const fixture = await render();

    // Assert
    expect(fixture.nativeElement.textContent).toContain('Owner controls');
  });

  it('hides its content from players', async () => {
    // Arrange
    isGameClient.set(false);

    // Act
    const fixture = await render();

    // Assert
    expect(fixture.nativeElement.textContent).not.toContain('Owner controls');
  });

  it('shows its content once the client is identified as the game client', async () => {
    // Arrange
    const fixture = await render();

    // Act
    isGameClient.set(true);
    await fixture.whenStable();

    // Assert
    expect(fixture.nativeElement.querySelectorAll('p')).toHaveLength(1);
  });

  it('removes its content when the client stops being the game client', async () => {
    // Arrange
    isGameClient.set(true);
    const fixture = await render();

    // Act
    isGameClient.set(false);
    await fixture.whenStable();

    // Assert
    expect(fixture.nativeElement.querySelectorAll('p')).toHaveLength(0);
  });
});
