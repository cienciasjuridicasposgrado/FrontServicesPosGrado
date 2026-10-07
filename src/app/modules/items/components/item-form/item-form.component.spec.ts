import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { CreateItemUseCase } from '../../../../core/application/usecase/items/create-item.usecase';
import { GetItemByCodigoUseCase } from '../../../../core/application/usecase/items/get-item-by-codigo.usecase';
import { UpdateItemUseCase } from '../../../../core/application/usecase/items/update-item.usecase';
import { ItemModel } from '../../../../core/domain/models/item.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ItemFormComponent } from './item-form.component';

describe('ItemFormComponent', () => {
  const item: ItemModel = { codigo: 'ABC', nombreItem: 'Papel', stock: 15, unidad: 'paq' };
  let createItem: jasmine.SpyObj<CreateItemUseCase>;
  let updateItem: jasmine.SpyObj<UpdateItemUseCase>;
  let getItem: jasmine.SpyObj<GetItemByCodigoUseCase>;
  let notification: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    createItem = jasmine.createSpyObj<CreateItemUseCase>('CreateItemUseCase', ['execute']);
    updateItem = jasmine.createSpyObj<UpdateItemUseCase>('UpdateItemUseCase', ['execute']);
    getItem = jasmine.createSpyObj<GetItemByCodigoUseCase>('GetItemByCodigoUseCase', ['execute']);
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['showSuccess', 'showError']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    createItem.execute.and.resolveTo(item);
    updateItem.execute.and.resolveTo(item);
    getItem.execute.and.resolveTo(item);
  });

  afterEach(() => TestBed.resetTestingModule());

  async function render(codigo?: string): Promise<ComponentFixture<ItemFormComponent>> {
    await TestBed.configureTestingModule({
      imports: [ItemFormComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(codigo ? { codigo } : {}) } } },
        { provide: Router, useValue: router },
        { provide: CreateItemUseCase, useValue: createItem },
        { provide: UpdateItemUseCase, useValue: updateItem },
        { provide: GetItemByCodigoUseCase, useValue: getItem }
      ]
    })
      .overrideComponent(ItemFormComponent, {
        set: { providers: [{ provide: NotificationService, useValue: notification }] }
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ItemFormComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('creates without a stock control or editable stock input', async () => {
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.form.contains('stock')).toBeFalse();
    expect(fixture.nativeElement.querySelector('[formControlName="stock"]')).toBeNull();
    component.form.setValue({ codigo: ' abc ', nombreItem: 'Papel', unidad: 'paq' });
    component.save();
    await fixture.whenStable();

    expect(createItem.execute).toHaveBeenCalledOnceWith({
      codigo: 'ABC', nombreItem: 'Papel', unidad: 'paq'
    });
  });

  it('shows codigo and stock as read-only information and PATCHes only metadata', async () => {
    const fixture = await render('ABC');
    const component = fixture.componentInstance;
    const codigoInput = fixture.nativeElement.querySelector('[formControlName="codigo"]') as HTMLInputElement;

    expect(codigoInput.disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Stock actual: 15');
    expect(fixture.nativeElement.querySelector('[formControlName="stock"]')).toBeNull();

    component.form.patchValue({ nombreItem: 'Papel carta', unidad: 'caja' });
    component.save();
    await fixture.whenStable();

    expect(updateItem.execute).toHaveBeenCalledOnceWith('ABC', {
      nombreItem: 'Papel carta', unidad: 'caja'
    });
    const payload = updateItem.execute.calls.mostRecent().args[1] as Record<string, unknown>;
    expect(payload['codigo']).toBeUndefined();
    expect(payload['stock']).toBeUndefined();
  });
});
