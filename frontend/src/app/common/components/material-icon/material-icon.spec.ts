import { TestBed } from '@angular/core/testing';
import { MaterialIcon } from './material-icon';

describe('MaterialIcon', () => {
  async function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(MaterialIcon);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('span') as HTMLSpanElement;
  }

  it('renders the symbol name as the ligature text', async () => {
    // Arrange
    const inputs = { icon: 'settings' };

    // Act
    const icon = await render(inputs);

    // Assert
    expect(icon.textContent).toBe('settings');
  });

  describe('accessibility', () => {
    it('is hidden from assistive tech when it has no label', async () => {
      // Arrange
      const inputs = { icon: 'share' };

      // Act
      const icon = await render(inputs);

      // Assert
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.hasAttribute('aria-label')).toBe(false);
      expect(icon.hasAttribute('role')).toBe(false);
    });

    it('is exposed as a labelled image when it has a label', async () => {
      // Arrange
      const inputs = { icon: 'share', label: 'Del lobby' };

      // Act
      const icon = await render(inputs);

      // Assert
      expect(icon.getAttribute('role')).toBe('img');
      expect(icon.getAttribute('aria-label')).toBe('Del lobby');
      expect(icon.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  describe('appearance', () => {
    it('applies the requested size in pixels', async () => {
      // Arrange
      const inputs = { icon: 'qr_code', size: 30 };

      // Act
      const icon = await render(inputs);

      // Assert
      expect(icon.style.fontSize).toBe('30px');
    });

    it('inherits the surrounding font size when no size is given', async () => {
      // Arrange
      const inputs = { icon: 'qr_code' };

      // Act
      const icon = await render(inputs);

      // Assert
      expect(icon.style.fontSize).toBe('');
    });

    it.each([
      [{ icon: 'pause' }, "'FILL' 0, 'wght' 400"],
      [{ icon: 'pause', fill: true, weight: 300 }, "'FILL' 1, 'wght' 300"],
    ])('translates fill and weight %o into font variation settings', async (inputs, expected) => {
      // Arrange
      const expectedSettings = expected;

      // Act
      const icon = await render(inputs);

      // Assert
      expect(icon.style.getPropertyValue('font-variation-settings')).toBe(expectedSettings);
    });
  });
});
