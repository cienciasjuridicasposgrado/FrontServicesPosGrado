import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, ActivatedRoute } from "@angular/router";
import { CreateRoleUseCase } from "../../../../core/application/usecase/roles/create-role.usecase";
import { UpdateRoleUseCase } from "../../../../core/application/usecase/roles/update-role.usecase";
import { UpdateRoleModel, CreateRoleModel } from "../../../../core/domain/models/role.model";
import { NotificationService } from "../../../../shared/services/notification.service";
import { GetRoleByIdUseCase } from "../../../../core/application/usecase/roles/get-role-by-id.usecase";
import { MatDividerModule } from "@angular/material/divider";

@Component({
    selector: 'app-role-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatDividerModule
    ],
    templateUrl: './role-form.component.html',
    styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnInit {
    roleForm: FormGroup;
    isEditMode = false;
    roleId: number | null = null;
    loading = false;
    
    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private createRoleUseCase: CreateRoleUseCase,
        private updateRoleUseCase: UpdateRoleUseCase,
        private getRoleByIdUseCase: GetRoleByIdUseCase
    ) {
        this.roleForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(50)]],
        description: ['', Validators.maxLength(255)],
        canMakeEntry: [false],
        canGenerateSeals: [false],
        canGenerateLetters: [false]
        });
    }

    ngOnInit(): void {
        this.roleId = Number(this.route.snapshot.paramMap.get('id'));
        if (this.roleId) {
        this.isEditMode = true;
        this.loadRoleData(this.roleId);
        }
    }

    async loadRoleData(id: number): Promise<void> {
        this.loading = true;
        try {
        const role = await this.getRoleByIdUseCase.execute(id);
        
        this.roleForm.patchValue({
            name: role.name,
            description: role.description,
            canMakeEntry: role.can_make_entry,
            canGenerateSeals: role.can_make_seals,
            canGenerateLetters: role.can_make_letter
        });

        this.loading = false;
        } catch (error) {
        console.error('Error al cargar datos del rol:', error);
        this.notificationService.showError('No se pudo cargar el rol para edición.');
        this.router.navigate(['/dashboard/roles']);
        }
    }

    async onSubmit(): Promise<void> {
        if (this.roleForm.invalid) {
        this.roleForm.markAllAsTouched();
        this.notificationService.showWarning('Por favor, complete todos los campos obligatorios.');
        return;
        }

        this.loading = true;
        const data = this.roleForm.value;

        try {
        if (this.isEditMode && this.roleId !== null) {
            const updateData: UpdateRoleModel = data;
            await this.updateRoleUseCase.execute(this.roleId, updateData);
            this.notificationService.showSuccess(`Rol "${data.name}" actualizado exitosamente.`);
        } else {
            const createData: CreateRoleModel = data;
            await this.createRoleUseCase.execute(createData);
            this.notificationService.showSuccess(`Rol "${data.name}" creado exitosamente.`);
        }
        
        this.router.navigate(['/dashboard/roles']);
        } catch (error: any) {
        console.error('Error en la operación CRUD:', error);
        const message = error.message || (this.isEditMode ? 'Error al actualizar el rol.' : 'Error al crear el rol.');
        this.notificationService.showError(message);
        } finally {
        this.loading = false;
        }
    }

    onCancel(): void {
        this.router.navigate(['/dashboard/roles']);
    }
}