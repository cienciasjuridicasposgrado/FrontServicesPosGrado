import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRoles } from './list-roles';

describe('ListRoles', () => {
  let component: ListRoles;
  let fixture: ComponentFixture<ListRoles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListRoles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListRoles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
