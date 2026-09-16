import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyParticipantSettingsDrawer } from './lobby-participant-settings-drawer';
import { OVERLAY_DATA, OverlayHandle } from '../../services/overlay/models/overlay-handle';
import { LobbyParticipantDTO } from '../../../api-models/model/lobbyParticipantDTO';
import { createOverlayHandle } from '../../../testing/overlay';

describe('LobbyParticipantSettingsDrawer', () => {
  let handle: OverlayHandle<unknown>;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render(participant: LobbyParticipantDTO) {
    handle = createOverlayHandle();
    TestBed.configureTestingModule({
      providers: [
        { provide: OVERLAY_DATA, useValue: participant },
        { provide: OverlayHandle, useValue: handle },
      ],
    });
    const fixture = TestBed.createComponent(LobbyParticipantSettingsDrawer);
    await fixture.whenStable();
    return fixture;
  }

  function button(element: HTMLElement, text: string): HTMLButtonElement {
    const match = Array.from(element.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === text,
    );
    if (!match) throw new Error(`No button with text "${text}"`);
    return match;
  }

  function sips(element: HTMLElement): string | undefined {
    return element.querySelector('.sips-buttons h2')?.textContent?.trim();
  }

  async function click(fixture: ComponentFixture<unknown>, text: string, times = 1) {
    for (let i = 0; i < times; i++) {
      button(fixture.nativeElement, text).click();
      await fixture.whenStable();
    }
  }

  describe('initial settings', () => {
    it("shows the participant's name and current settings", async () => {
      // Arrange
      const participant = { id: 'a', name: 'Mathias', sipsInABeer: 12, canDrawAce: false };

      // Act
      const fixture = await render(participant);

      // Assert
      expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Mathias');
      expect(sips(fixture.nativeElement)).toBe('12');
      expect(button(fixture.nativeElement, 'Nej')).toBeTruthy();
    });

    it('falls back to 14 sips and allowing aces when the participant has no settings', async () => {
      // Arrange
      const participant = { id: 'a', name: 'Mathias' };

      // Act
      const fixture = await render(participant);

      // Assert
      expect(sips(fixture.nativeElement)).toBe('14');
      expect(button(fixture.nativeElement, 'Ja')).toBeTruthy();
    });

    it('disables saving while nothing has changed', async () => {
      // Arrange
      const participant = { id: 'a', name: 'Mathias', sipsInABeer: 14, canDrawAce: true };

      // Act
      const fixture = await render(participant);

      // Assert
      expect(button(fixture.nativeElement, 'Gem').disabled).toBe(true);
    });
  });

  describe('sips in a beer', () => {
    it('increases and decreases by one sip per click', async () => {
      // Arrange
      const fixture = await render({ id: 'a', name: 'Mathias', sipsInABeer: 14 });

      // Act
      await click(fixture, '+', 3);
      await click(fixture, '-');

      // Assert
      expect(sips(fixture.nativeElement)).toBe('16');
    });

    it('cannot go below one sip', async () => {
      // Arrange
      const fixture = await render({ id: 'a', name: 'Mathias', sipsInABeer: 2 });

      // Act
      await click(fixture, '-');

      // Assert
      expect(sips(fixture.nativeElement)).toBe('1');
      expect(button(fixture.nativeElement, '-').disabled).toBe(true);
    });

    it('cannot go above 99 sips', async () => {
      // Arrange
      const fixture = await render({ id: 'a', name: 'Mathias', sipsInABeer: 98 });

      // Act
      await click(fixture, '+');

      // Assert
      expect(sips(fixture.nativeElement)).toBe('99');
      expect(button(fixture.nativeElement, '+').disabled).toBe(true);
    });
  });

  describe('saving', () => {
    it('closes with the changed settings', async () => {
      // Arrange
      const fixture = await render({ id: 'a', name: 'Mathias', sipsInABeer: 14, canDrawAce: true });
      await click(fixture, '+');
      await click(fixture, 'Ja');

      // Act
      await click(fixture, 'Gem');

      // Assert
      await expect(handle.closed).resolves.toEqual({ sipsInABeer: 15, canDrawAce: false });
    });

    it('cannot save once changes are reverted to the original settings', async () => {
      // Arrange
      const fixture = await render({ id: 'a', name: 'Mathias', sipsInABeer: 14, canDrawAce: true });
      const close = vi.spyOn(handle, 'close');
      await click(fixture, '+');
      await click(fixture, '-');

      // Act
      button(fixture.nativeElement, 'Gem').click();
      await fixture.whenStable();

      // Assert
      expect(button(fixture.nativeElement, 'Gem').disabled).toBe(true);
      expect(close).not.toHaveBeenCalled();
    });
  });
});
