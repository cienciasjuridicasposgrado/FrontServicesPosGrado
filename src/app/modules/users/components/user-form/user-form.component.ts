import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { Router, ActivatedRoute } from "@angular/router";
import { CreateUserUseCase } from "../../../../core/application/usecase/users/create-user.usecase";
import { UpdateUserUseCase } from "../../../../core/application/usecase/users/update-user.usecase";
import { GetUserByCiUseCase } from "../../../../core/application/usecase/users/get-user-by-ci.usecase";
import { GetAllRolesUseCase } from "../../../../core/application/usecase/roles/get-all-roles.usecase";
import { UpdateUserModel, CreateUserModel, UserModel } from "../../../../core/domain/models/user.model";
import { RoleModel } from "../../../../core/domain/models/role.model";
import { NotificationService } from "../../../../shared/services/notification.service";
import { MatDividerModule } from "@angular/material/divider";

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatDividerModule
    ],
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
    userForm: FormGroup;
    isEditMode = false;
    userCi: number | null = null;
    loading = false;
    roles: RoleModel[] = [];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private createUserUseCase: CreateUserUseCase,
        private updateUserUseCase: UpdateUserUseCase,
        private getUserByCiUseCase: GetUserByCiUseCase,
        private getAllRolesUseCase: GetAllRolesUseCase
    ) {
        this.userForm = this.fb.group({
            ci: ['', [Validators.required, Validators.min(1000000), Validators.max(99999999)]],
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            password: ['', [Validators.minLength(8)]],
            role_id: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        this.loadRoles();
        this.userCi = Number(this.route.snapshot.paramMap.get('ci'));
        
        if (this.userCi) {
            this.isEditMode = true;
            this.loadUserData(this.userCi);
            // En modo edición, el CI no se puede cambiar y la contraseña es opcional
            this.userForm.get('ci')?.disable();
            this.userForm.get('password')?.clearValidators();
            this.userForm.get('password')?.updateValueAndValidity();
        } else {
            // En modo creación, la contraseña es obligatoria
            this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
            this.userForm.get('password')?.updateValueAndValidity();
        }
    }

    async loadRoles(): Promise<void> {
        try {
            this.roles = await this.getAllRolesUseCase.execute();
        } catch (error) {
            console.error('Error al cargar roles:', error);
            this.notificationService.showError('No se pudieron cargar los roles disponibles.');
        }
    }

    async loadUserData(ci: number): Promise<void> {
        this.loading = true;
        try {
            const user = await this.getUserByCiUseCase.execute(ci);
            
            this.userForm.patchValue({
                ci: user.ci,
                nombre: user.nombre,
                role_id: user.role_id
            });

            this.loading = false;
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            this.notificationService.showError('No se pudo cargar el usuario para edición.');
            this.router.navigate(['/dashboard/users']);
        }
    }

    async onSubmit(): Promise<void> {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            this.notificationService.showWarning('Por favor, complete todos los campos obligatorios correctamente.');
            return;
        }

        this.loading = true;
        const formData = this.userForm.getRawValue();

        try {
            if (this.isEditMode && this.userCi !== null) {
                // En edición, solo enviamos los campos que cambiaron
                const updateData: UpdateUserModel = {
                    nombre: formData.nombre,
                    role_id: formData.role_id
                };

                // Solo incluimos la contraseña si se proporcionó una nueva
                if (formData.password && formData.password.length >= 8) {
                    (updateData as any).password = formData.password;
                }

                await this.updateUserUseCase.execute(this.userCi, updateData);
                this.notificationService.showSuccess(`Usuario "${formData.nombre}" actualizado exitosamente.`);
            } else {
                // En creación, enviamos todos los datos incluyendo contraseña
                const createData: CreateUserModel = {
                    ci: formData.ci,
                    nombre: formData.nombre,
                    password: formData.password,
                    role_id: formData.role_id
                };

                await this.createUserUseCase.execute(createData);
                this.notificationService.showSuccess(`Usuario "${formData.nombre}" creado exitosamente.`);
            }
            
            this.router.navigate(['/dashboard/users']);
        } catch (error: any) {
            console.error('Error en la operación CRUD:', error);
            const message = error.message || (this.isEditMode ? 'Error al actualizar el usuario.' : 'Error al crear el usuario.');
            this.notificationService.showError(message);
        } finally {
            this.loading = false;
        }
    }

    onCancel(): void {
        this.router.navigate(['/dashboard/users']);
    }
}