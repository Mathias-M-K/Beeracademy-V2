import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dot } from './dot';

describe('Dot', () => {
  let component: Dot;
  let fixture: ComponentFixture<Dot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dot],
    }).compileComponents();

    fixture = TestBed.createComponent(Dot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
