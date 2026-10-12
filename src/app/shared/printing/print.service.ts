import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

export interface PrintColumn<T> {
  heading: string;
  value: (row: T) => string | number | null | undefined;
}

/** Uses textContent throughout: API and user data never become HTML. */
@Injectable({ providedIn: 'root' })
export class PrintService {
  printList<T>(title: string, source: MatTableDataSource<T>, columns: PrintColumn<T>[]): void {
    const filtered = source.filteredData.slice();
    const ordered = source.sort?.active && source.sort.direction
      ? source.sortData(filtered, source.sort)
      : filtered;
    const rows = ordered.map(row => columns.map(column => String(column.value(row) ?? '—')));
    if (!rows.length) return;
    this.openSheet(title, columns.map(column => column.heading), rows);
  }

  printOutput(output: {
    id: number; fecha: Date | string; itemCodigo: string; cantidad: number;
    item?: { nombreItem: string }; departamento?: { nombre: string };
    user?: { nombre: string }; userCi: number; observacion?: string;
    estado?: string;
  }): void {
    const status = output.estado?.trim();
    const cancelled = status ? /anulad|cancelad/i.test(status) : false;
    const details: [string, string][] = [
      ['Identificador del movimiento', String(output.id)],
      ['Fecha del movimiento', this.date(output.fecha)],
      ['Artículo', output.item?.nombreItem || 'No disponible'],
      ['Código del artículo', output.itemCodigo],
      ['Cantidad entregada', String(output.cantidad)],
      ['Departamento receptor', output.departamento?.nombre || 'No disponible'],
    ];
    if (output.user?.nombre) details.push(['Registrado por', `${output.user.nombre} · CI ${output.userCi}`]);
    else if (output.userCi) details.push(['Registrado por', `CI ${output.userCi}`]);
    if (output.observacion) details.push(['Observación', output.observacion]);
    details.push(['Estado', status || 'Registrada']);

    const doc = this.createDocument('Constancia de salida');
    if (!doc) return;
    const { body } = doc;
    body.classList.add('constancia');
    this.append(body, 'p', 'LEXI · INVENTARIO', 'brand');
    this.append(body, 'h1', 'CONSTANCIA DE SALIDA');
    if (cancelled) this.append(body, 'p', 'ANULADA · SIN VIGENCIA', 'cancelled');
    this.append(body, 'p', `Impreso: ${this.date(new Date())}`, 'meta');
    const dl = doc.createElement('dl');
    for (const [label, value] of details) {
      this.append(dl, 'dt', label);
      this.append(dl, 'dd', value);
    }
    body.appendChild(dl);
    const signatures = doc.createElement('section');
    signatures.className = 'signatures';
    for (const label of ['Entregó', 'Recibí conforme']) {
      const block = doc.createElement('div');
      this.append(block, 'strong', label);
      this.append(block, 'span', 'Nombre y firma', 'signature-line');
      signatures.appendChild(block);
    }
    body.appendChild(signatures);
    this.finish(doc);
  }

  private openSheet(title: string, headings: string[], rows: string[][]): void {
    const doc = this.createDocument(title);
    if (!doc) return;
    const { body } = doc;
    this.append(body, 'p', 'LEXI · LISTADO INSTITUCIONAL', 'brand');
    this.append(body, 'h1', title);
    this.append(body, 'p', `Impreso: ${this.date(new Date())} · ${rows.length} ${rows.length === 1 ? 'resultado' : 'resultados'}`, 'meta');
    const table = doc.createElement('table');
    const thead = doc.createElement('thead');
    const headingRow = doc.createElement('tr');
    headings.forEach(heading => this.append(headingRow, 'th', heading));
    thead.appendChild(headingRow);
    table.appendChild(thead);
    const tbody = doc.createElement('tbody');
    rows.forEach(values => {
      const tr = doc.createElement('tr');
      values.forEach(value => this.append(tr, 'td', value));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.appendChild(table);
    this.finish(doc);
  }

  private createDocument(title: string): Document | null {
    const sheet = window.open('', '_blank');
    if (!sheet) {
      window.alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para Lexi.');
      return null;
    }
    const doc = sheet.document;
    doc.title = `Lexi · ${title}`;
    const style = doc.createElement('style');
    style.textContent = `
      @page { size: A4 portrait; margin: 16mm; }
      * { box-sizing: border-box; }
      body { font: 11pt/1.4 Arial, sans-serif; color: #111; margin: 0; }
      .brand { font-size: 9pt; font-weight: bold; letter-spacing: .08em; }
      h1 { font-size: 17pt; margin: 8mm 0 3mm; }
      .meta { color: #444; font-size: 9pt; margin-bottom: 8mm; }
      table { border-collapse: collapse; width: 100%; table-layout: auto; }
      thead { display: table-header-group; }
      th, td { border: 1px solid #777; padding: 2.5mm; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { background: #eee; font-weight: bold; }
      tr { break-inside: avoid; }
      dl { display: grid; grid-template-columns: 60mm 1fr; margin: 8mm 0 0; }
      dt, dd { margin: 0; padding: 3mm 0; border-bottom: 1px solid #ccc; overflow-wrap: anywhere; white-space: pre-wrap; }
      dt { font-weight: bold; padding-right: 4mm; }
      .cancelled { border: 2px solid #111; padding: 4mm; font-size: 16pt; font-weight: bold; text-align: center; }
      .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 16mm; margin-top: 24mm; break-inside: avoid; }
      .signatures > div { min-height: 35mm; display: flex; flex-direction: column; justify-content: space-between; }
      .signature-line { border-top: 1px solid #111; padding-top: 2mm; }
      @media screen { body { max-width: 210mm; padding: 16mm; margin: 0 auto; } }
    `;
    doc.head.appendChild(style);
    return doc;
  }

  private append(parent: Node, tag: string, value: string, className?: string): HTMLElement {
    const element = parent.ownerDocument!.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
  }

  private finish(doc: Document): void {
    const view = doc.defaultView;
    if (!view) return;
    view.addEventListener('afterprint', () => view.close(), { once: true });
    view.setTimeout(() => { view.focus(); view.print(); }, 200);
  }

  private date(value: Date | string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-BO');
  }
}
