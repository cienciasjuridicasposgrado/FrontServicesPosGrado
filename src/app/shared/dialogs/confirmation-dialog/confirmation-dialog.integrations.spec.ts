import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NEVER } from 'rxjs';
import { EntriesListComponent } from '../../../modules/inventory/components/entries-list/entries-list.component';
import { OutputsListComponent } from '../../../modules/inventory/components/outputs-list/outputs-list.component';
import { ItemsListComponent } from '../../../modules/items/components/items-list/items-list.component';
import { LetterNumbersListComponent } from '../../../modules/letter-numbers/components/letter-numbers-list/letter-numbers-list.component';
import { SealNumbersListComponent } from '../../../modules/seal-numbers/components/seal-numbers-list/seal-numbers-list.component';
import { UsersListComponent } from '../../../modules/users/components/users-list/users-list.component';
import { ConfirmationDialogService } from './confirmation-dialog.service';

describe('institutional confirmation integrations', () => {
  let confirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;
  let refreshAfterMutation: jasmine.Spy;
  let periodicRefresh: { create: jasmine.Spy };
  const permissionService = { has: () => true };

  beforeEach(() => {
    confirmationDialog = jasmine.createSpyObj<ConfirmationDialogService>('ConfirmationDialogService', ['confirm']);
    refreshAfterMutation = jasmine.createSpy('refreshAfterMutation');
    periodicRefresh = {
      create: jasmine.createSpy('create').and.returnValue({
        events$: NEVER,
        refresh: jasmine.createSpy('refresh'),
        refreshAfterMutation,
        stop: jasmine.createSpy('stop')
      })
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ConfirmationDialogService, useValue: confirmationDialog }]
    });
  });

  it('never deletes a user when the confirmation is cancelled', async () => {
    confirmationDialog.confirm.and.resolveTo(false);
    const deleteUseCase = { execute: jasmine.createSpy('execute').and.resolveTo() };
    let component!: UsersListComponent;
    TestBed.runInInjectionContext(() => {
      component = new UsersListComponent(
        {} as never,
        {} as never,
        {} as never,
        deleteUseCase as never,
        periodicRefresh as never,
        permissionService as never
      );
    });
    component.ngOnInit();
    component.dataSource.data = [{ ci: 123, nombre: 'Operador local', roleId: 2 }];

    await component.deleteUser(123);

    expect(confirmationDialog.confirm).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      title: 'Eliminar usuario',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
      recordLabel: 'Operador local · CI 123'
    }));
    expect(deleteUseCase.execute).not.toHaveBeenCalled();
    expect(refreshAfterMutation).not.toHaveBeenCalled();
  });

  it('keeps the item identifier and refreshes only after a confirmed deletion', async () => {
    confirmationDialog.confirm.and.resolveTo(true);
    const deleteUseCase = { execute: jasmine.createSpy('execute').and.resolveTo() };
    const notification = { showSuccess: jasmine.createSpy('showSuccess'), showError: jasmine.createSpy('showError') };
    let component!: ItemsListComponent;
    TestBed.runInInjectionContext(() => {
      component = new ItemsListComponent(
        {} as never,
        {} as never,
        notification as never,
        deleteUseCase as never,
        periodicRefresh as never,
        permissionService as never
      );
    });
    component.ngOnInit();
    component.dataSource.data = [{ codigo: 'PAP-01', nombreItem: 'Papel bond', stock: 8, unidad: 'paquete' }];

    await component.deleteItem('PAP-01');

    expect(deleteUseCase.execute).toHaveBeenCalledOnceWith('PAP-01');
    expect(refreshAfterMutation).toHaveBeenCalledOnceWith();
    expect(component.loading).toBeFalse();
  });

  it('preserves entry annulment semantics and stock warning', async () => {
    confirmationDialog.confirm.and.resolveTo(true);
    const deleteUseCase = { execute: jasmine.createSpy('execute').and.resolveTo() };
    const notification = { showSuccess: jasmine.createSpy('showSuccess'), showError: jasmine.createSpy('showError') };
    let component!: EntriesListComponent;
    TestBed.runInInjectionContext(() => {
      component = new EntriesListComponent(
        {} as never,
        {} as never,
        notification as never,
        deleteUseCase as never,
        periodicRefresh as never,
        permissionService as never
      );
    });
    component.ngOnInit();
    component.dataSource.data = [{
      id: 41,
      itemCodigo: 'PAP-01',
      cantidad: 10,
      userCi: 123,
      fecha: new Date(),
      observacion: '',
      item: { codigo: 'PAP-01', nombreItem: 'Papel bond', stock: 8, unidad: 'paquete' }
    }];

    await component.deleteEntry(41);

    expect(confirmationDialog.confirm).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      title: 'Anular entrada',
      confirmLabel: 'Anular entrada',
      variant: 'warning',
      recordLabel: 'Entrada #41 · Papel bond · 10 unidades'
    }));
    expect(deleteUseCase.execute).toHaveBeenCalledOnceWith(41);
    expect(refreshAfterMutation).toHaveBeenCalledOnceWith();
  });

  it('preserves the existing HTTP error treatment after a confirmed entry annulment', async () => {
    confirmationDialog.confirm.and.resolveTo(true);
    const deleteUseCase = {
      execute: jasmine.createSpy('execute').and.rejectWith(new HttpErrorResponse({
        status: 409,
        error: { message: 'No se puede anular la entrada con el stock actual.' }
      }))
    };
    const notification = { showSuccess: jasmine.createSpy('showSuccess'), showError: jasmine.createSpy('showError') };
    let component!: EntriesListComponent;
    TestBed.runInInjectionContext(() => {
      component = new EntriesListComponent(
        {} as never,
        {} as never,
        notification as never,
        deleteUseCase as never,
        periodicRefresh as never,
        permissionService as never
      );
    });
    component.ngOnInit();

    await component.deleteEntry(41);

    expect(notification.showError).toHaveBeenCalledOnceWith('No se puede anular la entrada con el stock actual.');
    expect(notification.showSuccess).not.toHaveBeenCalled();
    expect(refreshAfterMutation).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('preserves output annulment semantics and does not call it deletion', async () => {
    confirmationDialog.confirm.and.resolveTo(true);
    const deleteUseCase = { execute: jasmine.createSpy('execute').and.resolveTo() };
    const notification = { showSuccess: jasmine.createSpy('showSuccess'), showError: jasmine.createSpy('showError') };
    let component!: OutputsListComponent;
    TestBed.runInInjectionContext(() => {
      component = new OutputsListComponent(
        {} as never,
        deleteUseCase as never,
        {} as never,
        notification as never,
        periodicRefresh as never,
        permissionService as never
      );
    });
    component.ngOnInit();
    component.dataSource.data = [{
      id: 52,
      itemCodigo: 'TON-01',
      cantidad: 3,
      userCi: 123,
      departamentoId: 4,
      fecha: new Date(),
      item: { codigo: 'TON-01', nombreItem: 'Tóner', stock: 2, unidad: 'unidad' }
    }];

    await component.deleteOutput(52);

    const dialogData = confirmationDialog.confirm.calls.mostRecent().args[0];
    expect(dialogData.title).toBe('Anular salida');
    expect(dialogData.confirmLabel).toBe('Anular salida');
    expect(dialogData.description.toLowerCase()).not.toContain('eliminar');
    expect(deleteUseCase.execute).toHaveBeenCalledOnceWith(52);
    expect(refreshAfterMutation).toHaveBeenCalledOnceWith();
  });

  it('keeps exact seal and letter identifiers for their confirmed operations', async () => {
    confirmationDialog.confirm.and.resolveTo(true);
    const deleteSeal = { execute: jasmine.createSpy('deleteSeal').and.resolveTo() };
    const deleteLetter = { execute: jasmine.createSpy('deleteLetter').and.resolveTo() };
    const snackBar = { open: jasmine.createSpy('open') };
    let seals!: SealNumbersListComponent;
    let letters!: LetterNumbersListComponent;
    TestBed.runInInjectionContext(() => {
      seals = new SealNumbersListComponent(
        {} as never,
        deleteSeal as never,
        {} as never,
        snackBar as never,
        periodicRefresh as never,
        permissionService as never
      );
      letters = new LetterNumbersListComponent(
        {} as never,
        deleteLetter as never,
        {} as never,
        periodicRefresh as never,
        permissionService as never
      );
    });
    seals.ngOnInit();
    letters.ngOnInit();
    seals.dataSource.data = [{
      id: 7,
      numeroSello: 'S-2026-07',
      user_ci: 123,
      userName: 'Operador',
      fecha: '2026-10-11'
    }];
    letters.dataSource.data = [{
      id: 9,
      numero_carta: 'C-2026-09',
      fecha: '2026-10-11',
      user: { ci: 123, nombre: 'Operador' }
    }];

    await seals.deleteSeal(7);
    await letters.delete(9);

    expect(deleteSeal.execute).toHaveBeenCalledOnceWith(7);
    expect(deleteLetter.execute).toHaveBeenCalledOnceWith(9);
    expect(refreshAfterMutation).toHaveBeenCalledTimes(2);
  });
});
