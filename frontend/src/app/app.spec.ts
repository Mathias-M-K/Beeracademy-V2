import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders a router outlet for the routed pages', async () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [provideRouter([])] });

    // Act
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // Assert
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
