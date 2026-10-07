import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>lock</mat-icon>
        <mat-card-title>Acceso no permitido</mat-card-title>
        <mat-card-subtitle>No tienes los permisos necesarios para esta operación.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-actions>
        <a mat-button color="primary" routerLink="/dashboard">Volver al dashboard</a>
      </mat-card-actions>
    </mat-card>
  `
})
export class ForbiddenComponent {}
