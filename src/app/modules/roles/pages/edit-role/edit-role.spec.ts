import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRole } from './edit-role';

describe('EditRole', () => {
  let component: EditRole;
  let fixture: ComponentFixture<EditRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditRole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditRole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
