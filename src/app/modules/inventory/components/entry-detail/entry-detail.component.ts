import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { GetEntryByIdUseCase } from '../../../../core/application/usecase/inventory-entries/get-entry-by-id.usecase';
import { UpdateEntryUseCase } from '../../../../core/application/usecase/inventory-entries/update-entry.usecase';
import { NotificationService } from '../../../../shared/services/notification.service';
import { InventoryEntryModel } from '../../../../core/domain/models/inventory-entry.model';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { httpErrorMessage } from '../../../../shared/utils/http-error-message';

@Component({
    selector: 'app-entry-detail',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, ReactiveFormsModule],
    templateUrl: './entry-detail.component.html',
    styleUrls: ['./entry-detail.component.scss']
})
export class EntryDetailComponent implements OnInit {
    readonly permissions = PERMISSIONS;
    entry!: InventoryEntryModel;
    loading = false;
    form!: FormGroup;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private getEntryByIdUseCase: GetEntryByIdUseCase,
        private updateEntryUseCase: UpdateEntryUseCase,
        private fb: FormBuilder,
        private notificationService: NotificationService,
        readonly permissionService: PermissionService
    ) {}

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.form = this.fb.group({
        observacion: ['', [Validators.maxLength(255)]]
        });
        this.loadEntry(id);
    }

    async loadEntry(id: number): Promise<void> {
        this.loading = true;
        try {
        this.entry = await this.getEntryByIdUseCase.execute(id);
        this.form.patchValue({ observacion: this.entry.observacion });
        } catch (error) {
        this.notificationService.showError('No se pudo cargar la entrada.');
        } finally {
        this.loading = false;
        }
    }

    async updateObservation(): Promise<void> {
        if (this.form.invalid) return;

        const observacion = this.form.get('observacion')?.value;
        try {
        await this.updateEntryUseCase.execute(this.entry.id, { observacion });
        this.notificationService.showSuccess('Observación actualizada correctamente.');
        this.router.navigate(['/dashboard/entries']);
        } catch (error) {
        this.notificationService.showError(httpErrorMessage(error, 'Error al actualizar observación.'));
        }
    }

    goBack(): void {
        this.router.navigate(['/dashboard/entries']);
    }
}
