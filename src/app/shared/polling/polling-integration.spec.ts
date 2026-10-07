import { TestBed } from '@angular/core/testing';
import { NEVER, Subject, of } from 'rxjs';
import { ItemModel } from '../../core/domain/models/item.model';
import { DashboardComponent } from '../../modules/dashboard/components/dashboard/dashboard.component';
import { LayoutComponent } from '../../modules/dashboard/components/layout/layout.component';
import { DepartamentosListComponent } from '../../modules/departamentos/components/departamentos-list/departamentos-list.component';
import { EntriesListComponent } from '../../modules/inventory/components/entries-list/entries-list.component';
import { OutputsListComponent } from '../../modules/inventory/components/outputs-list/outputs-list.component';
import { ItemsListComponent } from '../../modules/items/components/items-list/items-list.component';
import { LetterNumbersListComponent } from '../../modules/letter-numbers/components/letter-numbers-list/letter-numbers-list.component';
import { RolesListComponent } from '../../modules/roles/components/roles-list/roles-list.component';
import { SealNumbersListComponent } from '../../modules/seal-numbers/components/seal-numbers-list/seal-numbers-list.component';
import { UsersListComponent } from '../../modules/users/components/users-list/users-list.component';
import {
  PeriodicRefreshEvent,
  PeriodicRefreshHandle,
  PeriodicRefreshOptions
} from './periodic-refresh.service';

describe('polling integration', () => {
  it('wires only list reads with each centralized interval', () => {
    const read = jasmine.createSpy('read').and.resolveTo([]);
    const dashboardService = {
      getStats: jasmine.createSpy('getStats').and.returnValue(of({
        totalItems: 0,
        lowStockItems: 0,
        lastItemCode: null
      })),
      getRecentActivities: jasmine.createSpy('getRecentActivities').and.returnValue(of([]))
    };
    const handle: PeriodicRefreshHandle<unknown> = {
      events$: NEVER,
      refresh: jasmine.createSpy('refresh'),
      refreshAfterMutation: jasmine.createSpy('refreshAfterMutation'),
      stop: jasmine.createSpy('stop')
    };
    const create = jasmine.createSpy('create').and.returnValue(handle);
    const periodicRefresh = { create };
    const permissionService = { has: () => true, hasAll: () => true, hasAny: () => true };
    const readUseCase = { execute: read };
    const empty = {};

    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => {
      new SealNumbersListComponent(readUseCase as never, empty as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
      new LetterNumbersListComponent(readUseCase as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
      new ItemsListComponent(readUseCase as never, empty as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
      new EntriesListComponent(readUseCase as never, empty as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
      new OutputsListComponent(readUseCase as never, empty as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
      new DashboardComponent(
        dashboardService as never,
        { getCurrentUser: () => null } as never,
        periodicRefresh as never
      ).ngOnInit();
      new UsersListComponent(readUseCase as never, empty as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
      new RolesListComponent(readUseCase as never, empty as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
      new DepartamentosListComponent(readUseCase as never, empty as never, empty as never, empty as never,
        periodicRefresh as never, permissionService as never).ngOnInit();
    });

    const options = create.calls.allArgs().map(([argument]) =>
      argument as PeriodicRefreshOptions<unknown>
    );
    expect(options.map(({ intervalMs }) => intervalMs)).toEqual([
      3000,
      3000,
      5000,
      5000,
      5000,
      10000,
      10000,
      15000,
      15000,
      15000
    ]);

    for (const option of options) option.request();
    expect(read).toHaveBeenCalledTimes(8);
    expect(dashboardService.getStats).toHaveBeenCalledOnceWith();
    expect(dashboardService.getRecentActivities).toHaveBeenCalledOnceWith();
  });

  it('stops every polling controller before starting logout', () => {
    const order: string[] = [];
    const authService = {
      logout: jasmine.createSpy('logout').and.callFake(() => order.push('logout'))
    };
    const periodicRefresh = {
      stopAll: jasmine.createSpy('stopAll').and.callFake(() => order.push('stopAll'))
    };
    const component = new LayoutComponent(
      authService as never,
      {} as never,
      {} as never,
      {} as never,
      periodicRefresh as never
    );

    component.logout();

    expect(order).toEqual(['stopAll', 'logout']);
  });

  it('keeps list filters and loading state stable during background refreshes', () => {
    const events = new Subject<PeriodicRefreshEvent<ItemModel[]>>();
    const handle: PeriodicRefreshHandle<ItemModel[]> = {
      events$: events,
      refresh: () => undefined,
      refreshAfterMutation: () => undefined,
      stop: () => undefined
    };
    const periodicRefresh = { create: () => handle };
    let component!: ItemsListComponent;

    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => {
      component = new ItemsListComponent(
        {} as never,
        {} as never,
        { showError: () => undefined } as never,
        {} as never,
        periodicRefresh as never,
        {} as never
      );
      component.ngOnInit();
    });

    component.dataSource.filter = 'papel';
    events.next({
      type: 'success',
      data: [{ codigo: 'A', nombreItem: 'Papel', stock: 10, unidad: 'u' }],
      cause: 'initial',
      initial: true
    });
    expect(component.loading).toBeFalse();

    events.next({
      type: 'success',
      data: [{ codigo: 'A', nombreItem: 'Papel', stock: 20, unidad: 'u' }],
      cause: 'interval',
      initial: false
    });
    expect(component.loading).toBeFalse();
    expect(component.dataSource.filter).toBe('papel');
    expect(component.dataSource.data[0].stock).toBe(20);
  });

  it('keeps each dashboard resource when the other request fails', () => {
    const statsEvents = new Subject<PeriodicRefreshEvent<any>>();
    const activityEvents = new Subject<PeriodicRefreshEvent<any[]>>();
    const handles = [
      { events$: statsEvents, refresh: () => undefined, refreshAfterMutation: () => undefined, stop: () => undefined },
      { events$: activityEvents, refresh: () => undefined, refreshAfterMutation: () => undefined, stop: () => undefined }
    ];
    const periodicRefresh = { create: jasmine.createSpy('create').and.returnValues(...handles) };
    let component!: DashboardComponent;

    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => {
      component = new DashboardComponent(
        { getStats: () => NEVER, getRecentActivities: () => NEVER } as never,
        { getCurrentUser: () => null } as never,
        periodicRefresh as never
      );
      component.ngOnInit();
    });

    statsEvents.next({
      type: 'success',
      data: { totalItems: 7, lowStockItems: 2, lastItemCode: 'ITEM-007' },
      cause: 'initial',
      initial: true
    });
    activityEvents.next({
      type: 'error',
      error: { status: 500 },
      cause: 'initial',
      initial: true,
      terminal: false
    });

    expect(component.loading).toBeFalse();
    expect(component.stats?.totalItems).toBe(7);
    expect(component.activityError).not.toBe('');
    expect(component.statsError).toBe('');

    activityEvents.next({
      type: 'success',
      data: [],
      cause: 'interval',
      initial: false
    });
    expect(component.stats?.lastItemCode).toBe('ITEM-007');
    expect(component.activityError).toBe('');
  });
});
