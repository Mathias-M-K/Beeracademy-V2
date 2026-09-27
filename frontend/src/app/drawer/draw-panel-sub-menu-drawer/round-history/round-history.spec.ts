import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoundHistory } from './round-history';

describe('RoundHistory', () => {
  let component: RoundHistory;
  let fixture: ComponentFixture<RoundHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(RoundHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
