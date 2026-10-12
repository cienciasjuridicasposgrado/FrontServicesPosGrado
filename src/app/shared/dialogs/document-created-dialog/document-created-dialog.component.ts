import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

export interface DocumentCreatedData {
  type: 'Sello' | 'Carta';
  number: string;
}

@Component({
  selector: 'app-document-created-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.type }} generado correctamente</h2>
    <mat-dialog-content>
      <p class="caption">Número asignado</p>
      <strong class="document-number">{{ data.number }}</strong>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="copyNumber()"><mat-icon>content_copy</mat-icon> Copiar número</button>
      <button mat-flat-button mat-dialog-close type="button">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .caption { color: var(--color-text-secondary); margin: 0 0 8px; }
    .document-number { display: block; color: var(--color-primary); font-size: clamp(1.35rem, 5vw, 2rem); overflow-wrap: anywhere; user-select: text; }
    mat-dialog-content { padding-block: 12px 24px; }
    mat-dialog-actions { gap: 8px; flex-wrap: wrap; }
  `]
})
export class DocumentCreatedDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: DocumentCreatedData,
    private readonly snackBar: MatSnackBar,
    private readonly clipboard: Clipboard
  ) {}

  copyNumber(): void {
    if (this.clipboard.copy(this.data.number)) {
      this.snackBar.open('Número copiado.', 'Cerrar', { duration: 2500 });
    } else {
      this.snackBar.open('No se pudo copiar. Selecciona el número para copiarlo.', 'Cerrar', { duration: 4000 });
    }
  }
}
