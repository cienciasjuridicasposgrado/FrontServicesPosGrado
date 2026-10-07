import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/application/services/auth.service';
import { DashboardService } from '../../../../core/application/services/dashboard.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getStats: () => of({
              totalItems: 1,
              lowStockItems: 1,
              lastItemCode: 'ITEM-001'
            }),
            getRecentActivities: () => of([{
              id: '8',
              type: 'entry',
              itemId: 'ITEM-001',
              itemNombre: 'Papel bond',
              cantidad: 10,
              fecha: '2026-10-07T14:30:00.000Z',
              observacion: 'Ingreso local'
            }])
          }
        },
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => null }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('renders the camelCase stats and recent activity contract', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Total de Ítems');
    expect(text).toContain('ITEM-001');
    expect(text).toContain('10 unid. de Papel bond');
    expect(text).toContain('Entrada');
    expect(text).toContain('07/10/26 10:30');
  });
});
