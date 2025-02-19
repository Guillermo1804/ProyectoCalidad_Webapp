import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterUserComponentComponent } from './register-user-component.component';

describe('RegisterUserComponentComponent', () => {
  let component: RegisterUserComponentComponent;
  let fixture: ComponentFixture<RegisterUserComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterUserComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterUserComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
