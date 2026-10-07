import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { InventoryOutputModel } from '../../../../core/domain/models/inventory-output.model';
import { GetOutputByIdUseCase } from '../../../../core/application/usecase/inventory-outputs/get-output-by-id.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';

@Component({
  selector: 'app-output-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './output-detail.component.html',
  styleUrls: ['./output-detail.component.scss']
})
export class OutputDetailComponent implements OnInit {
  readonly permissions = PERMISSIONS;
  output: InventoryOutputModel | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private getOutputByIdUseCase: GetOutputByIdUseCase,
    private notificationService: NotificationService,
    readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadOutputDetail(id);
    } else {
      this.notificationService.showError('ID de salida no válido');
      this.router.navigate(['/dashboard/outputs']);
    }
  }

  async loadOutputDetail(id: number): Promise<void> {
    this.loading = true;
    try {
      this.output = await this.getOutputByIdUseCase.execute(id);
      this.loading = false;
    } catch (error) {
      console.error('Error al cargar detalle de salida:', error);
      this.notificationService.showError('No se pudo cargar el detalle de la salida');
      this.router.navigate(['/dashboard/outputs']);
    }
  }

  goBack(): void {
    this.location.back();
  }

  editOutput(): void {
    if (this.output) {
      this.router.navigate([`/dashboard/outputs/edit/${this.output.id}`]);
    }
  }
}
