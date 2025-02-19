import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomComponentComponent } from './hom-component.component';

describe('HomComponentComponent', () => {
  let component: HomComponentComponent;
  let fixture: ComponentFixture<HomComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
