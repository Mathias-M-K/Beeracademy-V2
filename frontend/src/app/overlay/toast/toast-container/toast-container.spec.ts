import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { Mock } from 'vitest';
import { ToastContainer } from './toast-container';
import { ToastService } from '../../../services/toast/toast.service';
import { ToastData, ToastState } from '../models/toast-data';

describe('ToastContainer', () => {
  let toast: WritableSignal<ToastData | null>;
  let dismissToast: Mock;

  beforeEach(() => {
    toast = signal<ToastData | null>(null);
    dismissToast = vi.fn();
  });

  async function render() {
    TestBed.configureTestingModule({
      providers: [{ provide: ToastService, useValue: { toast, dismissToast } }],
    });
    const fixture = TestBed.createComponent(ToastContainer);
    await fixture.whenStable();
    return fixture;
  }

  function rendered(fixture: ComponentFixture<ToastContainer>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-toast'));
  }

  it('renders nothing without a toast', async () => {
    // Arrange
    const fixture = await render();

    // Act
    await fixture.whenStable();

    // Assert
    expect(rendered(fixture)).toHaveLength(0);
  });

  it('renders the current toast with its title and message', async () => {
    // Arrange
    const fixture = await render();

    // Act
    toast.set(new ToastData('Plads optaget', 'Nogen andre er logget ind', 'close'));
    await fixture.whenStable();

    // Assert
    expect(rendered(fixture)).toHaveLength(1);
    expect(rendered(fixture)[0].textContent).toContain('Nogen andre er logget ind');
  });

  it('renders the replacement when a new toast arrives', async () => {
    // Arrange
    const fixture = await render();
    toast.set(new ToastData('First', 'one', 'info'));
    await fixture.whenStable();

    // Act
    toast.set(new ToastData('Second', 'two', 'info', ToastState.success));
    await fixture.whenStable();

    // Assert
    expect(rendered(fixture).at(-1)?.textContent).toContain('two');
  });

  it('dismisses the toast by its id when it is clicked', async () => {
    // Arrange
    const fixture = await render();
    const current = new ToastData('First', 'one', 'info');
    toast.set(current);
    await fixture.whenStable();

    // Act
    rendered(fixture)[0].querySelector('button')!.click();

    // Assert
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(current.id);
  });
});
