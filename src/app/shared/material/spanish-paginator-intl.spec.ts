import { SpanishPaginatorIntl } from './spanish-paginator-intl';

describe('SpanishPaginatorIntl', () => {
  const paginator = new SpanishPaginatorIntl();

  it('localiza las etiquetas de navegación', () => {
    expect(paginator.itemsPerPageLabel).toBe('Filas por página:');
    expect(paginator.nextPageLabel).toBe('Página siguiente');
    expect(paginator.previousPageLabel).toBe('Página anterior');
  });

  it('describe rangos vacíos y paginados', () => {
    expect(paginator.getRangeLabel(0, 10, 0)).toBe('0 de 0');
    expect(paginator.getRangeLabel(1, 10, 24)).toBe('11–20 de 24');
  });
});
