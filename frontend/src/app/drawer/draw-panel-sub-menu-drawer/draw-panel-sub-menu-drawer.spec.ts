import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawPanelSubMenuDrawer } from './draw-panel-sub-menu-drawer';
import { OVERLAY_DATA } from '../../services/overlay/models/overlay-handle';

describe('DrawPanelSubMenuDrawer', () => {
  let component: DrawPanelSubMenuDrawer;
  let fixture: ComponentFixture<DrawPanelSubMenuDrawer>;

  beforeEach(async () => {
    Element.prototype.scrollTo = () => undefined;
    await TestBed.configureTestingModule({
      imports: [DrawPanelSubMenuDrawer],
      providers: [{ provide: OVERLAY_DATA, useValue: 0 }],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawPanelSubMenuDrawer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollTo;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
