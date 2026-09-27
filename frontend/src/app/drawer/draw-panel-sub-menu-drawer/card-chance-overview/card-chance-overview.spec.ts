import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardChanceOverview } from './card-chance-overview';

describe('CardChanceOverview', () => {
  let component: CardChanceOverview;
  let fixture: ComponentFixture<CardChanceOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardChanceOverview],
    }).compileComponents();

    fixture = TestBed.createComponent(CardChanceOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
