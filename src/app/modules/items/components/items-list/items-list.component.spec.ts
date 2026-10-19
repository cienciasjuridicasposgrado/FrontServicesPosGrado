import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ItemModel } from '../../../../core/domain/models/item.model';
import { GetAllItemsUseCase } from '../../../../core/application/usecase/items/get-all-items.usecase';
import { DeleteItemUseCase } from '../../../../core/application/usecase/items/delete-item.usecase';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PeriodicRefreshEvent, PeriodicRefreshService } from '../../../../shared/polling/periodic-refresh.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { PrintService } from '../../../../shared/printing/print.service';
import { ItemsListComponent } from './items-list.component';

describe('ItemsListComponent stock display', () => {
  let fixture: ComponentFixture<ItemsListComponent>;
  let events: Subject<PeriodicRefreshEvent<ItemModel[]>>;
  let permissionService: jasmine.SpyObj<PermissionService>;

  const items: ItemModel[] = [
    { codigo: 'CERO', nombreItem: 'Agotado', stock: 0, unidad: 'unidad' },
    { codigo: 'UNO', nombreItem: 'Pocas hojas', stock: 1, unidad: 'paquete' },
    { codigo: 'CINCO', nombreItem: 'Pocos sobres', stock: 5, unidad: 'caja' },
    { codigo: 'SEIS', nombreItem: 'Disponible', stock: 6, unidad: 'unidad' }
  ];

  beforeEach(async () => {
    events = new Subject<PeriodicRefreshEvent<ItemModel[]>>();
    permissionService = jasmine.createSpyObj<PermissionService>('PermissionService', ['has', 'hasAll']);
    permissionService.has.and.returnValue(false);
    permissionService.hasAll.and.returnValue(false);
    await TestBed.configureTestingModule({
      imports: [ItemsListComponent, NoopAnimationsModule],
      providers: [
        { provide: GetAllItemsUseCase, useValue: { execute: jasmine.createSpy('execute') } },
        { provide: DeleteItemUseCase, useValue: { execute: jasmine.createSpy('execute') } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: PermissionService, useValue: permissionService },
        { provide: PeriodicRefreshService, useValue: {
          create: () => ({
            events$: events.asObservable(), refresh: jasmine.createSpy('refresh'),
            refreshAfterMutation: jasmine.createSpy('refreshAfterMutation'),
            stop: jasmine.createSpy('stop')
          })
        } },
        { provide: ConfirmationDialogService, useValue: { confirm: jasmine.createSpy('confirm') } },
        { provide: PrintService, useValue: { printList: jasmine.createSpy('printList') } }
      ]
    }).overrideComponent(ItemsListComponent, {
      set: { providers: [{ provide: NotificationService, useValue: {} }] }
    }).compileComponents();

    fixture = TestBed.createComponent(ItemsListComponent);
    fixture.detectChanges();
    events.next({ type: 'success', data: items, cause: 'initial', initial: true });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function stockCell(codigo: string): HTMLElement {
    const row = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row') as NodeListOf<HTMLElement>)
      .find((candidate) => candidate.textContent?.includes(codigo));
    expect(row).toBeDefined();
    return row!.querySelector('td.mat-column-stock') as HTMLElement;
  }

  it('shows zero with a clear soft danger label', () => {
    const cell = stockCell('CERO');
    expect(cell.querySelector('.stock-cell__value')?.textContent?.trim()).toBe('0');
    expect(cell.querySelector('.status-badge--danger')?.textContent?.trim()).toBe('Sin stock');
  });

  it('labels stock from one through five as low', () => {
    for (const codigo of ['UNO', 'CINCO']) {
      const cell = stockCell(codigo);
      expect(cell.querySelector('.status-badge--warning')?.textContent?.trim()).toBe('Stock bajo');
      expect(cell.querySelector('.status-badge--danger')).toBeNull();
    }
  });

  it('keeps normal stock quiet while rendering all rows', () => {
    const cell = stockCell('SEIS');
    expect(cell.querySelector('.stock-cell__value')?.textContent?.trim()).toBe('6');
    expect(cell.querySelector('.status-badge')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(4);
  });

  it('keeps the existing client filter and table rendering', async () => {
    const input = fixture.nativeElement.querySelector('.filter-field input') as HTMLInputElement;
    input.value = 'CINCO';
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.dataSource.filteredData.map((item) => item.codigo)).toEqual(['CINCO']);
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(1);
    expect(stockCell('CINCO').textContent).toContain('Stock bajo');
  });

  it('shows the import button only when both required permissions are granted', () => {
    permissionService.hasAll.and.returnValue(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Importar ítems');

    permissionService.hasAll.and.returnValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Importar ítems');
  });

  it('shows the same static Excel template beside print only with import permissions', () => {
    const templateLink = () => fixture.nativeElement.querySelector('a[download]') as HTMLAnchorElement | null;

    permissionService.hasAll.and.returnValue(false);
    fixture.detectChanges();
    expect(templateLink()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Imprimir listado');

    permissionService.hasAll.and.returnValue(true);
    fixture.detectChanges();
    expect(templateLink()?.getAttribute('href')).toBe('templates/plantilla-importacion-items.xlsx');
    expect(templateLink()?.getAttribute('download')).toBe('plantilla-importacion-items.xlsx');
    expect(templateLink()?.textContent).toContain('Descargar plantilla Excel');
  });

  it('navigates to the import route from the import action', () => {
    const router = TestBed.inject(Router);
    fixture.componentInstance.importItems();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/items/import']);
  });
});
