import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartyShellComponent } from './party-shell.component';

describe('PartyShell', () => {
  let component: PartyShellComponent;
  let fixture: ComponentFixture<PartyShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PartyShellComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
