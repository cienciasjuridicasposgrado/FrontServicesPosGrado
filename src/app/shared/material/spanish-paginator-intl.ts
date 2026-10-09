import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class SpanishPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Filas por página:';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const safeLength = Math.max(length, 0);
    if (safeLength === 0 || pageSize === 0) return `0 de ${safeLength}`;

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, safeLength);
    return `${startIndex + 1}–${endIndex} de ${safeLength}`;
  };
}
