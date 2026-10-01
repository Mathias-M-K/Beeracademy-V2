import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EndOfGamePanel } from './end-of-game-panel.component';

describe('EndGamePanel', () => {
  let component: EndOfGamePanel;
  let fixture: ComponentFixture<EndOfGamePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EndOfGamePanel],
    }).compileComponents();

    fixture = TestBed.createComponent(EndOfGamePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
