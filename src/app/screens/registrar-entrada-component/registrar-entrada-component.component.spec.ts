import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarEntradaComponentComponent } from './registrar-entrada-component.component';

describe('RegistrarEntradaComponentComponent', () => {
  let component: RegistrarEntradaComponentComponent;
  let fixture: ComponentFixture<RegistrarEntradaComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarEntradaComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarEntradaComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
