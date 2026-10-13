import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from '../core/application/services/auth.service';
import { UserModel } from '../core/domain/models/user.model';
import { SealNumberModel } from '../core/domain/models/seal-number.model';
import { LetterNumberModel } from '../core/domain/models/letter-number.model';
import { SealNumbersListComponent } from './seal-numbers/components/seal-numbers-list/seal-numbers-list.component';
import { LetterNumbersListComponent } from './letter-numbers/components/letter-numbers-list/letter-numbers-list.component';
import { PeriodicRefreshEvent, PeriodicRefreshOptions } from '../shared/polling/periodic-refresh.service';
import { ConfirmationDialogService } from '../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { PrintService } from '../shared/printing/print.service';

describe('authorized document lists', () => {
  const ownSeal: SealNumberModel = {
    id: 7, numeroSello: 'S-1304137', user_ci: 900, userName: 'Operadora',
    fecha: '2026-10-12T12:00:00Z', observacion: 'Histórico'
  };
  const ownLetter: LetterNumberModel = {
    id: 8, numero_carta: '1315', fecha: '2026-10-12T12:00:00Z',
    user: { ci: 900, nombre: 'Operadora' }, observacion: 'Propia'
  };

  function harness() {
    const user$ = new BehaviorSubject<UserModel | null>({
      ci: 900, nombre: 'Operadora', roleId: 1,
      role: {
        id: 1, name: 'Operador', canMakeEntry: false, canMakeOutput: false,
        canManageUsers: false, canManageRoles: false, canManageCatalog: false,
        canGenerateSeals: true, canGenerateLetters: true
      }
    } as UserModel);
    const sealEvents = new Subject<PeriodicRefreshEvent<SealNumberModel[]>>();
    const letterEvents = new Subject<PeriodicRefreshEvent<LetterNumberModel[]>>();
    const sealHandle = {
      events$: sealEvents.asObservable(), refresh: jasmine.createSpy('sealRefresh'),
      refreshAfterMutation: jasmine.createSpy('sealMutation'), stop: jasmine.createSpy('sealStop')
    };
    const letterHandle = {
      events$: letterEvents.asObservable(), refresh: jasmine.createSpy('letterRefresh'),
      refreshAfterMutation: jasmine.createSpy('letterMutation'), stop: jasmine.createSpy('letterStop')
    };
    let created = 0;
    const periodic = { create: jasmine.createSpy('create').and.callFake(() =>
      (++created % 2 === 1 ? sealHandle : letterHandle)
    ) };
    const auth = { currentUser$: user$.asObservable(), getCurrentUser: () => user$.value };
    const permission = { has: () => true };
    const confirmation = { confirm: jasmine.createSpy('confirm').and.resolveTo(true) };
    const print = { printList: jasmine.createSpy('printList') };
    const deleteSeal = { execute: jasmine.createSpy('deleteSeal').and.resolveTo() };
    const deleteLetter = { execute: jasmine.createSpy('deleteLetter').and.resolveTo() };
    const getSeals = { execute: jasmine.createSpy('getSeals').and.resolveTo([ownSeal]) };
    const getLetters = { execute: jasmine.createSpy('getLetters').and.resolveTo([ownLetter]) };
    const snack = { open: jasmine.createSpy('open') };

    TestBed.configureTestingModule({ providers: [
      { provide: ConfirmationDialogService, useValue: confirmation },
      { provide: PrintService, useValue: print }
    ] });
    let seals!: SealNumbersListComponent;
    let letters!: LetterNumbersListComponent;
    TestBed.runInInjectionContext(() => {
      seals = new SealNumbersListComponent(
        getSeals as never, deleteSeal as never,
        {} as never, snack as never, periodic as never, auth as AuthService,
        permission as never
      );
      letters = new LetterNumbersListComponent(
        getLetters as never, deleteLetter as never,
        {} as never, periodic as never, auth as AuthService,
        permission as never
      );
    });
    seals.ngOnInit();
    letters.ngOnInit();
    return { user$, sealEvents, letterEvents, sealHandle, letterHandle,
      seals, letters, print, confirmation, deleteSeal, deleteLetter, getSeals, getLetters, periodic, snack };
  }

  it('uses only backend rows for filtering and print, preserving historic seal numbers', () => {
    const h = harness();
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'initial', initial: true });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'initial', initial: true });
    expect(h.seals.dataSource.data.map((row) => row.numeroSello)).toEqual(['S-1304137']);
    expect(h.letters.dataSource.data.map((row) => row.numero_carta)).toEqual(['1315']);
    h.seals.applyFilter({ target: { value: 'no existe' } } as unknown as Event);
    expect(h.seals.dataSource.filteredData).toEqual([]);
    h.seals.printList();
    expect(h.print.printList).not.toHaveBeenCalled();
    h.seals.applyFilter({ target: { value: 'S-1304137' } } as unknown as Event);
    h.letters.applyFilter({ target: { value: 'Operadora' } } as unknown as Event);
    expect(h.letters.dataSource.filteredData).toEqual([ownLetter]);
    h.seals.printList();
    h.letters.printList();
    expect(h.print.printList).toHaveBeenCalledTimes(2);
    expect(h.print.printList.calls.argsFor(0)[1]).toBe(h.seals.dataSource);
    expect(h.print.printList.calls.argsFor(1)[1]).toBe(h.letters.dataSource);
  });

  it('clears both lists on logout and ignores late responses from the old session', () => {
    const h = harness();
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'initial', initial: true });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'initial', initial: true });
    h.user$.next(null);
    expect(h.seals.dataSource.data).toEqual([]);
    expect(h.letters.dataSource.data).toEqual([]);
    expect(h.sealHandle.stop).toHaveBeenCalled();
    expect(h.letterHandle.stop).toHaveBeenCalled();
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'interval', initial: false });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'interval', initial: false });
    expect(h.seals.dataSource.data).toEqual([]);
    expect(h.letters.dataSource.data).toEqual([]);
    h.seals.printList();
    h.letters.printList();
    expect(h.print.printList).not.toHaveBeenCalled();
  });

  it('clears authorized rows when the same actor loses the wider user scope', () => {
    const h = harness();
    const current = h.user$.value!;
    h.user$.next({ ...current, role: { ...current.role!, canManageUsers: true } });
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'initial', initial: true });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'initial', initial: true });
    h.user$.next({ ...current, role: { ...current.role!, canManageUsers: false } });
    expect(h.seals.dataSource.data).toEqual([]);
    expect(h.letters.dataSource.data).toEqual([]);
  });

  it('uses the authorized row IDs for delete and reports a changed permission', async () => {
    const h = harness();
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'initial', initial: true });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'initial', initial: true });
    h.deleteSeal.execute.and.rejectWith(new HttpErrorResponse({ status: 403 }));
    h.deleteLetter.execute.and.rejectWith(new HttpErrorResponse({ status: 404 }));
    spyOn(console, 'error');
    await h.seals.deleteSeal(7);
    await h.letters.delete(8);
    expect(h.deleteSeal.execute).toHaveBeenCalledOnceWith(7);
    expect(h.deleteLetter.execute).toHaveBeenCalledOnceWith(8);
    expect(h.snack.open.calls.mostRecent().args[0]).toContain('permiso');
    expect(h.letters.errorMessage).toContain('no está disponible');
  });

  it('removes stale rows when a list request is rejected with 403 or 404', () => {
    const h = harness();
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'initial', initial: true });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'initial', initial: true });
    spyOn(console, 'error');
    h.sealEvents.next({
      type: 'error', error: new HttpErrorResponse({ status: 403 }),
      cause: 'interval', initial: false, terminal: true
    });
    h.letterEvents.next({
      type: 'error', error: new HttpErrorResponse({ status: 404 }),
      cause: 'manual', initial: false, terminal: false
    });
    expect(h.seals.dataSource.data).toEqual([]);
    expect(h.letters.dataSource.data).toEqual([]);
    expect(h.seals.errorMessage).toContain('permiso');
    expect(h.letters.errorMessage).toContain('no están disponibles');
  });

  it('clears stale rows after a later 404 even when polling suppresses repeated errors', async () => {
    const h = harness();
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'initial', initial: true });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'initial', initial: true });
    h.getSeals.execute.and.rejectWith(new HttpErrorResponse({ status: 404 }));
    h.getLetters.execute.and.rejectWith(new HttpErrorResponse({ status: 404 }));
    const sealRequest = h.periodic.create.calls.argsFor(0)[0] as PeriodicRefreshOptions<SealNumberModel[]>;
    const letterRequest = h.periodic.create.calls.argsFor(1)[0] as PeriodicRefreshOptions<LetterNumberModel[]>;
    await expectAsync(Promise.resolve(sealRequest.request())).toBeRejected();
    await expectAsync(Promise.resolve(letterRequest.request())).toBeRejected();
    expect(h.seals.dataSource.data).toEqual([]);
    expect(h.letters.dataSource.data).toEqual([]);
    expect(h.seals.errorMessage).toContain('no están disponibles');
    expect(h.letters.errorMessage).toContain('no están disponibles');
  });

  it('does not delete a document if the session changes during confirmation', async () => {
    const h = harness();
    h.sealEvents.next({ type: 'success', data: [ownSeal], cause: 'initial', initial: true });
    h.letterEvents.next({ type: 'success', data: [ownLetter], cause: 'initial', initial: true });
    let confirm!: (value: boolean) => void;
    h.confirmation.confirm.and.returnValue(new Promise((resolve) => { confirm = resolve; }));
    const sealDeletion = h.seals.deleteSeal(7);
    const letterDeletion = h.letters.delete(8);
    h.user$.next(null);
    confirm(true);
    await Promise.all([sealDeletion, letterDeletion]);
    expect(h.deleteSeal.execute).not.toHaveBeenCalled();
    expect(h.deleteLetter.execute).not.toHaveBeenCalled();
  });
});
