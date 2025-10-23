import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../../core/application/services/auth.service';
import { UserModel } from '../../../../core/domain/models/user.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  user: UserModel | null = null;
  currentDate: Date = new Date();
  activeRoute: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedroute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    })

    this.setActiveRoute();
    
    // Escuchar cambios de ruta
    this.router.events.subscribe(() => {
      this.setActiveRoute();
    });
  }

  private setActiveRoute(): void {
    const url = this.router.url;

    if (url.includes('roles')) {
      this.activeRoute = 'roles';
    } else if (url.includes('users')) {
      this.activeRoute = 'users';
    } else if (url.includes('departamentos')) {
      this.activeRoute = 'departamentos';
    } else if (url.includes('items')) {
      this.activeRoute = 'items';
    } else if (url.includes('entries')) {
      this.activeRoute = 'entries';
    } else if (url.includes('outputs')) {
      this.activeRoute = 'outputs';
    } else if(url.includes('seal-numbers')) {
      this.activeRoute = 'seal-numbers';
    } else {
      this.activeRoute = 'dashboard';
    }
  }

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(route: string): void {
    const fullRoute = route === '' ? '/dashboard' : `/dashboard/${route}`;
    this.router.navigate([fullRoute]);
  }
}