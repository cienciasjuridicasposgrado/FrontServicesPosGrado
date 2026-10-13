import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/application/services/auth.service';
import { GetAllItemsUseCase } from '../../../../core/application/usecase/items/get-all-items.usecase';
import { GetAllDepartamentosUseCase } from '../../../../core/application/usecase/departamentos/get-all-departamentos.usecase';
import { CreateOutputUseCase } from '../../../../core/application/usecase/inventory-outputs/create-output.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { OutputFormComponent } from './output-form.component';

describe('OutputFormComponent stock indication', () => {
  let fixture: ComponentFixture<OutputFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutputFormComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: AuthService, useValue: { getCurrentUser: () => ({ ci: 123 }) } },
        { provide: NotificationService, useValue: {
          showError: jasmine.createSpy('showError'), showSuccess: jasmine.createSpy('showSuccess')
        } },
        { provide: CreateOutputUseCase, useValue: { execute: jasmine.createSpy('execute') } },
        { provide: GetAllItemsUseCase, useValue: { execute: () => Promise.resolve([
          { codigo: 'CERO', nombreItem: 'Agotado', stock: 0, unidad: 'unidad' },
          { codigo: 'CINCO', nombreItem: 'Pocos', stock: 5, unidad: 'unidad' },
          { codigo: 'SEIS', nombreItem: 'Disponible', stock: 6, unidad: 'unidad' }
        ]) } },
        { provide: GetAllDepartamentosUseCase, useValue: { execute: () => Promise.resolve([]) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(OutputFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('adds a textual stock state to the existing read-only availability note', () => {
    const component = fixture.componentInstance;
    for (const [codigo, label, tone] of [
      ['CERO', 'Sin stock', 'danger'],
      ['CINCO', 'Stock bajo', 'warning'],
      ['SEIS', '', '']
    ]) {
      component.outputForm.patchValue({ itemCodigo: codigo });
      fixture.detectChanges();
      const note = fixture.nativeElement.querySelector('.stock-note') as HTMLElement;
      expect(note.textContent).toContain(`Stock disponible: ${component.selectedStock}`);
      if (label) {
        expect(note.querySelector('.status-badge')?.textContent?.trim()).toBe(label);
        expect(note.classList).toContain(`stock-note--${tone}`);
      } else {
        expect(note.querySelector('.status-badge')).toBeNull();
        expect(note.classList).not.toContain('stock-note--danger');
        expect(note.classList).not.toContain('stock-note--warning');
      }
    }
  });
});
