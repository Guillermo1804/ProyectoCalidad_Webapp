import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterAdminComponentComponent } from './register-admin-component.component';

describe('RegisterAdminComponentComponent', () => {
  let component: RegisterAdminComponentComponent;
  let fixture: ComponentFixture<RegisterAdminComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterAdminComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterAdminComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
