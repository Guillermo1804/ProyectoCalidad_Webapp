import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogComponentComponent } from './log-component.component';

describe('LogComponentComponent', () => {
  let component: LogComponentComponent;
  let fixture: ComponentFixture<LogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
