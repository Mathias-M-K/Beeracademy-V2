import { TestBed } from '@angular/core/testing';
import { AnimatedText } from './animated-text';

describe('AnimatedText', () => {
  async function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(AnimatedText);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one span per letter', async () => {
    // Arrange
    const inputs = { text: 'Lasse' };

    // Act
    const host = await render(inputs);

    // Assert
    const letters = Array.from(host.querySelectorAll('.letter')).map((l) => l.textContent);
    expect(letters).toEqual(['L', 'a', 's', 's', 'e']);
  });

  describe('accessibility', () => {
    it('exposes the whole text once to assistive tech', async () => {
      // Arrange
      const inputs = { text: 'Lasse' };

      // Act
      const host = await render(inputs);

      // Assert
      expect(host.querySelector('.visually-hidden')?.textContent).toBe('Lasse');
      expect(host.querySelector('.text')?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('appearance', () => {
    it('marks the host with the chosen effect', async () => {
      // Arrange
      const inputs = { text: 'Lasse', effect: 'roll' };

      // Act
      const host = await render(inputs);

      // Assert
      expect(host.classList).toContain('roll');
      expect(host.classList).not.toContain('letters');
    });
  });
});
