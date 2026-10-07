import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GetAllRolesUseCase } from '../../../../core/application/usecase/roles/get-all-roles.usecase';
import { AuthService } from '../../../../core/application/services/auth.service';
import { PermissionService } from '../../../../core/application/services/permission.service';
import { ChangeUserRoleUseCase } from '../../../../core/application/usecase/users/change-user-role.usecase';
import { CreateUserUseCase } from '../../../../core/application/usecase/users/create-user.usecase';
import { GetUserByCiUseCase } from '../../../../core/application/usecase/users/get-user-by-ci.usecase';
import { UpdateUserUseCase } from '../../../../core/application/usecase/users/update-user.usecase';
import { PERMISSIONS } from '../../../../core/domain/models/permission.model';
import { RoleModel } from '../../../../core/domain/models/role.model';
import {
    ChangeUserRoleModel,
    CreateUserModel,
    UpdateUserModel,
    UserModel
} from '../../../../core/domain/models/user.model';
import { NotificationService } from '../../../../shared/services/notification.service';

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
    readonly permissions = PERMISSIONS;
    readonly userForm: FormGroup;
    readonly roleForm: FormGroup;
    isEditMode = false;
    userCi: number | null = null;
    initialRoleId: number | null = null;
    loadingUser = false;
    savingGeneral = false;
    changingRole = false;
    accessDenied = false;
    roles: RoleModel[] = [];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private createUserUseCase: CreateUserUseCase,
        private updateUserUseCase: UpdateUserUseCase,
        private changeUserRoleUseCase: ChangeUserRoleUseCase,
        private getUserByCiUseCase: GetUserByCiUseCase,
        private getAllRolesUseCase: GetAllRolesUseCase,
        private authService: AuthService,
        readonly permissionService: PermissionService
    ) {
        this.userForm = this.fb.group({
            ci: ['', [Validators.required, Validators.min(1000000), Validators.max(99999999)]],
            nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            password: ['', [Validators.minLength(8)]]
        });
        this.roleForm = this.fb.group({
            role_id: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        const ciParam = this.route.snapshot.paramMap.get('ci');
        this.isEditMode = ciParam !== null;
        this.userCi = ciParam === null ? null : Number(ciParam);

        if (this.isEditMode) {
            if (!this.permissionService.has(this.permissions.manageUsers)) {
                this.denyAccess();
                return;
            }

            if (!this.userCi || !Number.isInteger(this.userCi)) {
                this.notificationService.showError('La cédula del usuario no es válida.');
                void this.router.navigate(['/dashboard/users']);
                return;
            }

            this.userForm.get('ci')?.disable();
            void this.loadUserData(this.userCi);
        } else {
            if (!this.canManageUserRoles()) {
                this.denyAccess();
                return;
            }

            this.userForm.get('password')?.setValidators([
                Validators.required,
                Validators.minLength(8)
            ]);
            this.userForm.get('password')?.updateValueAndValidity();
        }

        if (this.canManageUserRoles()) {
            void this.loadRoles();
        }
    }

    canManageUserRoles(): boolean {
        return this.permissionService.hasAll([
            this.permissions.manageUsers,
            this.permissions.manageRoles
        ]);
    }

    hasRoleChanged(): boolean {
        const selectedRoleId = Number(this.roleForm.get('role_id')?.value);
        return this.isEditMode &&
            this.initialRoleId !== null &&
            Number.isInteger(selectedRoleId) &&
            selectedRoleId !== this.initialRoleId;
    }

    async loadRoles(): Promise<void> {
        if (!this.canManageUserRoles()) return;

        try {
            this.roles = await this.getAllRolesUseCase.execute();
        } catch (error) {
            console.error('Error al cargar roles:', error);
            this.notificationService.showError('No se pudieron cargar los roles disponibles.');
        }
    }

    async loadUserData(ci: number): Promise<void> {
        this.loadingUser = true;
        try {
            const user = await this.getUserByCiUseCase.execute(ci);
            this.applyUser(user);
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            this.notificationService.showError(this.errorMessage(
                error,
                'No se pudo cargar el usuario para edición.'
            ));
            void this.router.navigate(['/dashboard/users']);
        } finally {
            this.loadingUser = false;
        }
    }

    async onSubmit(): Promise<void> {
        if (this.accessDenied) return;

        if (this.userForm.invalid || (!this.isEditMode && this.roleForm.invalid)) {
            this.userForm.markAllAsTouched();
            if (!this.isEditMode) this.roleForm.markAllAsTouched();
            this.notificationService.showWarning(
                'Por favor, complete todos los campos obligatorios correctamente.'
            );
            return;
        }

        if (this.isEditMode) {
            await this.saveGeneralData();
        } else {
            await this.createUser();
        }
    }

    async onChangeRole(): Promise<void> {
        if (
            !this.isEditMode ||
            this.userCi === null ||
            !this.canManageUserRoles() ||
            this.roleForm.invalid ||
            !this.hasRoleChanged()
        ) return;

        const changingOwnRole = this.authService.getCurrentUser()?.ci === this.userCi;
        const change: ChangeUserRoleModel = {
            role_id: Number(this.roleForm.get('role_id')?.value)
        };

        this.changingRole = true;
        try {
            await this.changeUserRoleUseCase.execute(this.userCi, change);
            this.notificationService.showSuccess('Rol del usuario actualizado exitosamente.');

            if (changingOwnRole) {
                await this.refreshAfterOwnRoleChange();
            } else {
                await this.refreshEditedUserAfterRoleChange();
            }
        } catch (error) {
            console.error('Error al cambiar el rol del usuario:', error);
            if (this.isNotFound(error)) {
                this.notificationService.showError('El usuario o el rol seleccionado ya no existe.');
                void this.router.navigate(['/dashboard/users']);
            } else {
                this.notificationService.showError(this.errorMessage(
                    error,
                    'No se pudo cambiar el rol del usuario.'
                ));
            }
        } finally {
            this.changingRole = false;
        }
    }

    onCancel(): void {
        void this.router.navigate(['/dashboard/users']);
    }

    private async createUser(): Promise<void> {
        if (!this.canManageUserRoles()) {
            this.denyAccess();
            return;
        }

        const createData: CreateUserModel = {
            ci: Number(this.userForm.get('ci')?.value),
            nombre: String(this.userForm.get('nombre')?.value).trim(),
            password: String(this.userForm.get('password')?.value),
            role_id: Number(this.roleForm.get('role_id')?.value)
        };

        this.savingGeneral = true;
        try {
            await this.createUserUseCase.execute(createData);
            this.notificationService.showSuccess(
                `Usuario "${createData.nombre}" creado exitosamente.`
            );
            void this.router.navigate(['/dashboard/users']);
        } catch (error) {
            console.error('Error al crear el usuario:', error);
            this.notificationService.showError(this.errorMessage(
                error,
                'No se pudo crear el usuario.'
            ));
        } finally {
            this.savingGeneral = false;
        }
    }

    private async saveGeneralData(): Promise<void> {
        if (this.userCi === null) return;

        const update: UpdateUserModel = {
            nombre: String(this.userForm.get('nombre')?.value).trim()
        };
        const password = String(this.userForm.get('password')?.value ?? '');
        if (password.length > 0) update.password = password;

        this.savingGeneral = true;
        try {
            const updatedUser = await this.updateUserUseCase.execute(this.userCi, update);
            this.applyUser(updatedUser);
            this.userForm.get('password')?.reset('');
            this.userForm.markAsPristine();
            this.notificationService.showSuccess(
                `Datos de "${updatedUser.nombre}" actualizados exitosamente.`
            );
        } catch (error) {
            console.error('Error al actualizar los datos del usuario:', error);
            if (this.isNotFound(error)) {
                this.notificationService.showError('El usuario ya no existe.');
                void this.router.navigate(['/dashboard/users']);
            } else {
                this.notificationService.showError(this.errorMessage(
                    error,
                    'No se pudieron actualizar los datos del usuario.'
                ));
            }
        } finally {
            this.savingGeneral = false;
        }
    }

    private async refreshAfterOwnRoleChange(): Promise<void> {
        try {
            const refreshedUser = await firstValueFrom(this.authService.refreshProfile());
            this.applyUser(refreshedUser);

            if (!this.permissionService.has(this.permissions.manageUsers)) {
                await this.router.navigate(['/dashboard']);
            }
        } catch (error) {
            console.error('El rol cambió, pero no se pudo refrescar el perfil:', error);
            this.notificationService.showWarning(
                'El rol cambió, pero no se pudo actualizar la sesión. Se volvió al panel principal.'
            );
            await this.router.navigate(['/dashboard']);
        }
    }

    private async refreshEditedUserAfterRoleChange(): Promise<void> {
        if (this.userCi === null) return;

        try {
            const refreshedUser = await this.getUserByCiUseCase.execute(this.userCi);
            this.applyUser(refreshedUser);
        } catch (error) {
            console.error('El rol cambió, pero no se pudo refrescar el usuario:', error);
            this.notificationService.showWarning(
                'El rol cambió, pero no se pudo refrescar la información mostrada.'
            );
        }
    }

    private applyUser(user: UserModel): void {
        this.userForm.patchValue({ ci: user.ci, nombre: user.nombre });
        this.roleForm.patchValue({ role_id: user.roleId });
        this.initialRoleId = user.roleId;
    }

    private denyAccess(): void {
        this.accessDenied = true;
        void this.router.navigate(['/dashboard/forbidden']);
    }

    private isNotFound(error: unknown): boolean {
        return error instanceof HttpErrorResponse && error.status === 404;
    }

    private errorMessage(error: unknown, fallback: string): string {
        if (error instanceof HttpErrorResponse) {
            if (error.status === 403) {
                return 'Ya no tiene permisos para realizar esta operación.';
            }
            if (typeof error.error?.message === 'string') {
                return error.error.message;
            }
            return fallback;
        }

        return error instanceof Error ? error.message : fallback;
    }
}
