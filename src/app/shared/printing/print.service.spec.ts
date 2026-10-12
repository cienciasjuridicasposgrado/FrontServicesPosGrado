import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, of } from 'rxjs';
import { PrintService } from './print.service';

describe('PrintService', () => {
  let service: PrintService;
  let sheet: Document;

  beforeEach(() => {
    service = new PrintService();
    sheet = document.implementation.createHTMLDocument('');
    spyOn(window, 'open').and.returnValue({ document: sheet } as Window);
  });

  it('prints every filtered row in the active order without actions or secrets', () => {
    const source = new MatTableDataSource([
      { name: 'Zeta', secret: 'token-z', action: 'delete' },
      { name: 'Alpha', secret: 'token-a', action: 'edit' },
      { name: 'Other', secret: 'token-o', action: 'edit' }
    ]);
    source.filterPredicate = (row, filter) => row.name !== filter;
    source.filter = 'Other';
    source.sort = {
      active: 'name', direction: 'asc', sortChange: new Subject(), initialized: of(void 0)
    } as unknown as MatSort;
    source.paginator = {
      pageIndex: 0, pageSize: 1, length: 3, page: new Subject(), initialized: of(void 0)
    } as unknown as MatPaginator;

    service.printList('Usuarios', source, [{ heading: 'Nombre', value: row => row.name }]);

    const printed = Array.from(sheet.querySelectorAll('tbody tr')).map(row => row.textContent);
    expect(printed).toEqual(['Alpha', 'Zeta']);
    expect(sheet.body.textContent).not.toContain('token');
    expect(sheet.body.textContent).not.toContain('delete');
    expect(sheet.body.textContent).toContain('2 resultados');
  });

  it('does not open an empty sheet when a search has no matches', () => {
    const source = new MatTableDataSource([{ name: 'Carta' }]);
    source.filterPredicate = (row, filter) => row.name === filter;
    source.filter = 'Sin coincidencias';

    service.printList('Cartas', source, [{ heading: 'Nombre', value: row => row.name }]);

    expect(window.open).not.toHaveBeenCalled();
  });

  it('uses text nodes for untrusted values and identifies an annulled output', () => {
    service.printOutput({
      id: 51, fecha: '2026-10-12T12:00:00Z', itemCodigo: '<script>alert(1)</script>',
      cantidad: 3, departamento: { nombre: 'Archivo' }, userCi: 123,
      observacion: 'Primera línea\nSegunda línea', estado: 'ANULADA'
    });

    expect(sheet.querySelector('script')).toBeNull();
    expect(sheet.body.textContent).toContain('<script>alert(1)</script>');
    expect(sheet.body.textContent).toContain('ANULADA · SIN VIGENCIA');
    expect(sheet.body.textContent).toContain('51');
    expect(sheet.body.textContent).toContain('3');
    expect(sheet.body.textContent).toContain('Registrado por');
    expect(sheet.body.textContent).toContain('CI 123');
    expect(sheet.querySelectorAll('.signature-line').length).toBe(2);
  });

  it('prints the selected movement fields without inventing approval or a receiver', () => {
    service.printOutput({
      id: 82, fecha: '2026-10-12T12:00:00Z', itemCodigo: 'PAP-01', cantidad: 7,
      item: { nombreItem: 'Papel carta' }, departamento: { nombre: 'Archivo' },
      user: { nombre: 'Operadora' }, userCi: 123, observacion: 'Entrega parcial'
    });

    const text = sheet.body.textContent || '';
    for (const value of ['82', 'PAP-01', 'Papel carta', '7', 'Archivo', 'Operadora', 'Entrega parcial', 'Registrada']) {
      expect(text).toContain(value);
    }
    expect(text).not.toContain('Aprobado');
    expect(text).not.toContain('Responsable receptor');
    expect(sheet.querySelectorAll('.signature-line').length).toBe(2);
  });
});
