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
    <mat-card class="form-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>lock</mat-icon>
        <mat-card-title><h1>Acceso no permitido</h1></mat-card-title>
        <mat-card-subtitle>No tienes permisos para acceder a esta sección.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-actions>
        <a mat-raised-button color="primary" routerLink="/dashboard">Volver al dashboard</a>
      </mat-card-actions>
    </mat-card>
  `
})
export class ForbiddenComponent {}
