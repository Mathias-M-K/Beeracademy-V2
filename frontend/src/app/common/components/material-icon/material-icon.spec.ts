import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialIcon } from './material-icon';

describe('MaterialIcon', () => {
  let component: MaterialIcon;
  let fixture: ComponentFixture<MaterialIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialIcon);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'settings');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
