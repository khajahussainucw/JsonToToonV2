import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonFixerComponent } from './json-fixer.component';

describe('JsonFixerComponent', () => {
  let component: JsonFixerComponent;
  let fixture: ComponentFixture<JsonFixerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFixerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonFixerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
