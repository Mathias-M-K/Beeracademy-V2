import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawPanelSubMenuDrawer } from './draw-panel-sub-menu-drawer';

describe('DrawPanelSubMenuDrawer', () => {
  let component: DrawPanelSubMenuDrawer;
  let fixture: ComponentFixture<DrawPanelSubMenuDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawPanelSubMenuDrawer],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawPanelSubMenuDrawer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
