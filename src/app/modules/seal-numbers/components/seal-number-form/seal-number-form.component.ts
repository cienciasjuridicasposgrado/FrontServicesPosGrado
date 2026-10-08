import { Component, DestroyRef, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/create-seal-number.usecase';
import { UpdateSealNumberUseCase } from '../../../../core/application/usecase/seal-numbers/update-seal-number.usecase';
import { CreateSealNumberModel, SealNumberModel } from '../../../../core/domain/models/seal-number.model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from '../../../../shared/services/notification.service';
import { GetUserLookupUseCase } from '../../../../core/application/usecase/users/get-user-lookup.usecase';
import { UserLookupModel } from '../../../../core/domain/models/user-lookup.model';
import { MatSelectModule } from '@angular/material/select';
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import {
  getInstitutionalNumberConflictCode,
  getInstitutionalNumberError,
  isUncertainCreationError
} from '../../../../shared/utils/institutional-number-error';
import { AuthService } from '../../../../core/application/services/auth.service';
import {
  CreationAttempt,
  createCreationAttempt
} from '../../../../shared/idempotency/creation-attempt';
import { IdempotencyKeyFactory } from '../../../../shared/idempotency/idempotency-key.factory';
import { IdempotencySessionService } from '../../../../shared/idempotency/idempotency-session.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-seal-number-form',
  standalone: true,
  templateUrl: './seal-number-form.component.html',
  styleUrls: ['./seal-number-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  providers: [NotificationService]
})
export class SealNumberFormComponent implements OnInit, OnDestroy {
    private readonly destroyRef = inject(DestroyRef);
    private creationAttempt: CreationAttempt<CreateSealNumberModel> | null = null;
    private operationVersion = 0;
    private sessionGeneration = -1;
    private destroyed = false;
  
    form: FormGroup;
    title: string;
    isEditMode: boolean;
    users: UserLookupModel[] = [];
    usersError = '';
    usersLoading = true;
    saving = false;
    errorTitle = '';
    errorMessage = '';

    constructor(
      private fb: FormBuilder,
      private createUseCase: CreateSealNumberUseCase,
      private updateUseCase: UpdateSealNumberUseCase,
      private getUserLookupUseCase: GetUserLookupUseCase,
      private authService: AuthService,
      private idempotencyKeyFactory: IdempotencyKeyFactory,
      private idempotencySession: IdempotencySessionService,
      private snackBar: MatSnackBar,
      private dialogRef: MatDialogRef<SealNumberFormComponent>,
      @Inject(MAT_DIALOG_DATA) public data: { action: 'create' | 'edit', seal?: SealNumberModel }
    ) {
      this.isEditMode = data.action === 'edit';
      this.title = this.isEditMode ? 'Editar Sello' : 'Registrar Nuevo Sello';

      this.form = this.fb.group({
        numeroSello: [{
          value: data.seal?.numeroSello || '',
          disabled: !this.isEditMode
        }, this.isEditMode ? Validators.required : []],
        user_ci: [{ value: data.seal?.user_ci || '', disabled: true }, Validators.required],
        observacion: [data.seal?.observacion || '']
      });
    }

    ngOnInit(): void {
      this.sessionGeneration = this.idempotencySession.currentGeneration;
      this.idempotencySession.invalidated$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.invalidatePendingAttempt());
      this.loadUsers();
    }

    ngOnDestroy(): void {
      this.destroyed = true;
      this.invalidatePendingAttempt();
    }

    get canRetrySameOperation(): boolean {
      return this.creationAttempt?.state === 'uncertain';
    }

    get canStartNewOperation(): boolean {
      return this.creationAttempt?.state === 'uncertain' || this.creationAttempt?.state === 'conflict';
    }

    get requiresAttemptDecision(): boolean {
      return !this.isEditMode && this.canStartNewOperation;
    }

    async loadUsers(): Promise<void> {
      this.usersError = '';
      this.usersLoading = true;
      try {
        this.users = await this.getUserLookupUseCase.execute();
        if (this.isEditMode && this.data.seal) {
          this.form.patchValue({
            user_ci: this.data.seal.user_ci
          });
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.usersError = getFallbackMessage(error, 'Error al cargar los usuarios.', {
          403: 'No tiene permiso para consultar los usuarios disponibles.'
        });
        this.snackBar.open(this.usersError, 'Cerrar', { duration: 3000});
      } finally {
        this.form.get('user_ci')?.enable();
        this.usersLoading = false;
      }
    }

    async save(): Promise<void> {
      if (this.form.invalid || this.saving || this.usersLoading) return;

      if (this.data.action === 'create' && this.requiresAttemptDecision) {
        return;
      }

      this.errorTitle = '';
      this.errorMessage = '';

      const formValue = this.form.getRawValue();
      const manualNumberRequested = Boolean(formValue.numeroSello?.trim());

      if (this.data.action === 'create') {
        await this.beginCreation(formValue as CreateSealNumberModel);
        return;
      }

      this.saving = true;
      try {
        await this.updateUseCase.execute(this.data.seal!.id, formValue);
        this.snackBar.open('Sello actualizado correctamente.', 'Cerrar', { duration: 3000 });

        this.dialogRef.close(true);

      } catch (error: unknown) {
        console.error(error);
        const errorContent = getInstitutionalNumberError(
          error,
          manualNumberRequested,
          'Error al guardar el sello.'
        );
        this.errorTitle = errorContent.title;
        this.errorMessage = errorContent.message;
        this.snackBar.open(`${errorContent.title}. ${errorContent.message}`, 'Cerrar', {
          duration: 5000
        });
      } finally {
        this.saving = false;
      }
    }

    async retrySameOperation(): Promise<void> {
      const attempt = this.creationAttempt;
      if (!attempt || attempt.state !== 'uncertain' || this.saving) return;

      await this.sendCreationAttempt(attempt);
    }

    async startNewOperation(): Promise<void> {
      if (!this.canStartNewOperation || this.saving || this.form.invalid || this.usersLoading) return;

      const confirmed = window.confirm(
        'La operación anterior pudo haberse completado. Revisa el listado antes de iniciar una nueva generación. ¿Deseas continuar con una clave nueva?'
      );
      if (!confirmed) return;

      this.creationAttempt = null;
      this.errorTitle = '';
      this.errorMessage = '';
      await this.beginCreation(this.form.getRawValue() as CreateSealNumberModel);
    }

    close(): void {
      if (this.creationAttempt?.state === 'uncertain') {
        const confirmed = window.confirm(
          'El resultado de la operación no está confirmado. Si cierras, ya no podrás reintentar con la misma clave desde este formulario. ¿Deseas cerrar?'
        );
        if (!confirmed) return;
      }

      this.invalidatePendingAttempt();
      this.dialogRef.close(false);
    }

    private async beginCreation(payload: CreateSealNumberModel): Promise<void> {
      const actorCi = this.authService.getCurrentUser()?.ci;
      if (actorCi === undefined ||
        this.sessionGeneration !== this.idempotencySession.currentGeneration) {
        this.errorTitle = 'Sesión no disponible';
        this.errorMessage = 'No se pudo asociar la operación a la sesión actual. Vuelve a iniciar sesión.';
        return;
      }

      try {
        const attempt = createCreationAttempt(
          'seal-number',
          this.idempotencyKeyFactory.create(),
          payload,
          actorCi
        );
        this.creationAttempt = attempt;
        await this.sendCreationAttempt(attempt);
      } catch (error: unknown) {
        if (!this.creationAttempt) {
          const errorContent = getInstitutionalNumberError(error, false, 'Error al iniciar la operación.');
          this.errorTitle = errorContent.title;
          this.errorMessage = errorContent.message;
        }
      }
    }

    private async sendCreationAttempt(attempt: CreationAttempt<CreateSealNumberModel>): Promise<void> {
      const version = this.operationVersion;
      attempt.state = 'sending';
      this.saving = true;
      this.errorTitle = '';
      this.errorMessage = '';

      try {
        await this.createUseCase.execute(attempt.payload, attempt.key);
        if (!this.isCurrentAttempt(attempt, version)) return;

        attempt.state = 'confirmed';
        this.creationAttempt = null;
        this.snackBar.open('Sello registrado exitosamente.', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      } catch (error: unknown) {
        if (!this.isCurrentAttempt(attempt, version)) return;

        console.error(error);
        const manualNumberRequested = Boolean(attempt.payload.numeroSello?.trim());
        const errorContent = getInstitutionalNumberError(
          error,
          manualNumberRequested,
          'Error al guardar el sello.',
          true
        );
        this.errorTitle = errorContent.title;
        this.errorMessage = errorContent.message;

        if (isUncertainCreationError(error)) {
          attempt.state = 'uncertain';
        } else if (getInstitutionalNumberConflictCode(error) ||
          (error instanceof HttpErrorResponse && error.status === 409)) {
          attempt.state = 'conflict';
        } else {
          this.creationAttempt = null;
        }

        this.snackBar.open(`${errorContent.title}. ${errorContent.message}`, 'Cerrar', {
          duration: 5000
        });
      } finally {
        if (version === this.operationVersion) {
          this.saving = false;
        }
      }
    }

    private isCurrentAttempt(
      attempt: CreationAttempt<CreateSealNumberModel>,
      version: number
    ): boolean {
      return !this.destroyed &&
        version === this.operationVersion &&
        this.sessionGeneration === this.idempotencySession.currentGeneration &&
        this.creationAttempt === attempt &&
        this.authService.getCurrentUser()?.ci === attempt.actorCi;
    }

    private invalidatePendingAttempt(): void {
      this.operationVersion += 1;
      this.creationAttempt = null;
      this.saving = false;
    }
}
