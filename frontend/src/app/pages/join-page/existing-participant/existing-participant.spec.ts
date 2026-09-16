import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExistingParticipant } from './existing-participant';
import { PartyParticipantDto } from '../../../../api-models/model/partyParticipantDto';

describe('ExistingParticipant', () => {
  const FREE: PartyParticipantDto = {
    id: 'p1',
    name: 'Mathias',
    session: { isClaimed: false, isConnected: false },
  };
  const RESERVED: PartyParticipantDto = {
    ...FREE,
    session: { isClaimed: true, isConnected: false },
  };
  const CONNECTED: PartyParticipantDto = {
    ...FREE,
    session: { isClaimed: true, isConnected: true },
  };

  async function render(participant: PartyParticipantDto, isBeingWatched = false) {
    const fixture = TestBed.createComponent(ExistingParticipant);
    fixture.componentRef.setInput('participant', participant);
    fixture.componentRef.setInput('isBeingWatched', isBeingWatched);
    await fixture.whenStable();
    return fixture;
  }

  function status(fixture: ComponentFixture<ExistingParticipant>): string {
    return fixture.nativeElement.querySelector('p').textContent.trim();
  }

  function buttons(fixture: ComponentFixture<ExistingParticipant>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  describe('status', () => {
    it.each([
      ['free', FREE, 'Ledig', 'isFree'],
      ['reserved', RESERVED, 'Reserveret', 'isReserved'],
      ['connected', CONNECTED, 'Forbundet', 'isConnected'],
    ])('shows a %s participant as such', async (_, participant, text, hostClass) => {
      // Arrange
      const input = participant;

      // Act
      const fixture = await render(input);

      // Assert
      expect(fixture.nativeElement.querySelector('h4').textContent).toBe('Mathias');
      expect(status(fixture)).toBe(text);
      expect(Array.from(fixture.nativeElement.classList)).toEqual([hostClass]);
    });

    it('shows that it is waiting while the participant is being watched', async () => {
      // Arrange
      const participant = RESERVED;

      // Act
      const fixture = await render(participant, true);

      // Assert
      expect(status(fixture)).toBe('Afventer...');
    });
  });

  describe('actions', () => {
    it('lets a free participant be joined', async () => {
      // Arrange
      const fixture = await render(FREE);
      const connect = vi.fn();
      const requestRelease = vi.fn();
      fixture.componentInstance.connect.subscribe(connect);
      fixture.componentInstance.requestRelease.subscribe(requestRelease);

      // Act
      buttons(fixture)[0].click();

      // Assert
      expect(buttons(fixture).map((button) => button.textContent?.trim())).toEqual(['Deltag']);
      expect(connect).toHaveBeenCalledWith(FREE);
      expect(requestRelease).not.toHaveBeenCalled();
    });

    it('lets the release of a reserved participant be requested', async () => {
      // Arrange
      const fixture = await render(RESERVED);
      const connect = vi.fn();
      const requestRelease = vi.fn();
      fixture.componentInstance.connect.subscribe(connect);
      fixture.componentInstance.requestRelease.subscribe(requestRelease);

      // Act
      buttons(fixture)[0].click();

      // Assert
      expect(buttons(fixture).map((button) => button.textContent?.trim())).toEqual(['Anmod']);
      expect(requestRelease).toHaveBeenCalledWith(RESERVED);
      expect(connect).not.toHaveBeenCalled();
    });

    it('offers no action for a connected participant', async () => {
      // Arrange
      const participant = CONNECTED;

      // Act
      const fixture = await render(participant);

      // Assert
      expect(buttons(fixture)).toHaveLength(0);
    });

    it('only offers to stop watching while the participant is being watched', async () => {
      // Arrange
      const fixture = await render(RESERVED, true);
      const removeWatcher = vi.fn();
      fixture.componentInstance.removeWatcher.subscribe(removeWatcher);

      // Act
      buttons(fixture)[0].click();

      // Assert
      expect(buttons(fixture)).toHaveLength(1);
      expect(removeWatcher).toHaveBeenCalledOnce();
    });
  });
});
