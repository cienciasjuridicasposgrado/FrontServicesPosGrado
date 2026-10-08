import { Component, DestroyRef, Inject, OnDestroy, OnInit, inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CreateLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/create-letter-number.usecase";
import { UpdateLetterNumberUseCase } from "../../../../core/application/usecase/letter-numbers/update-letter-number.usecase";
import { CreateLetterNumberModel, LetterNumberModel, UpdateLetterNumberModel } from "../../../../core/domain/models/letter-number.model";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { NotificationService } from "../../../../shared/services/notification.service";
import { MatSelectModule } from "@angular/material/select";
import { GetUserLookupUseCase } from "../../../../core/application/usecase/users/get-user-lookup.usecase";
import { getFallbackMessage } from '../../../../shared/utils/http-error-message';
import { UserLookupModel } from '../../../../core/domain/models/user-lookup.model';
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
  selector: 'app-letter-number-form',
  standalone: true,
  templateUrl: './letter-number-form.component.html',
  styleUrls: ['./letter-number-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  providers: [NotificationService]
})
export class LetterNumberFormComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private creationAttempt: CreationAttempt<CreateLetterNumberModel> | null = null;
  private operationVersion = 0;
  private sessionGeneration = -1;
  private destroyed = false;

  form: FormGroup;
  generatedNumber: string = '';
  saving = false;
  errorTitle = '';
  errorMessage = '';
  users: UserLookupModel[] = [];
  usersLoading = true;
  usersError = '';

  constructor(
    private fb: FormBuilder,
    private createUseCase: CreateLetterNumberUseCase,
    private updateUseCase: UpdateLetterNumberUseCase,
    private getUserLookupUseCase: GetUserLookupUseCase,
    private authService: AuthService,
    private idempotencyKeyFactory: IdempotencyKeyFactory,
    private idempotencySession: IdempotencySessionService,
    private dialogRef: MatDialogRef<LetterNumberFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: LetterNumberModel
  ) {
      this.form = this.fb.group({
        user_ci: [{ value: data?.user.ci || '', disabled: true }, Validators.required],
        observacion: [data?.observacion || '']
      });
  }

  ngOnInit(): void {
    this.sessionGeneration = this.idempotencySession.currentGeneration;
    this.idempotencySession.invalidated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.invalidatePendingAttempt());
    this.loadUsers();
    if (this.data) {
      this.generatedNumber = this.data.numero_carta;
    }
  }

  async loadUsers(): Promise<void> {
    this.usersError = '';
    this.usersLoading = true;
    try {
      this.users = await this.getUserLookupUseCase.execute();
      if (this.data) {
        this.form.patchValue({
          user_ci: this.data.user.ci
        });
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.usersError = getFallbackMessage(error, 'Error al cargar los usuarios.', {
        403: 'No tiene permiso para consultar los usuarios disponibles.'
      });
    } finally {
      this.form.get('user_ci')?.enable();
      this.usersLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.invalidatePendingAttempt();
  }

  get canRetrySameOperation(): boolean {
    return this.creationAttempt?.state === 'uncertain';
  }

  get originalAttemptPayload(): Readonly<CreateLetterNumberModel> | null {
    return this.creationAttempt?.state === 'uncertain'
      ? this.creationAttempt.payload
      : null;
  }

  get hasFormChangesSinceAttempt(): boolean {
    const original = this.originalAttemptPayload;
    if (!original) return false;

    const current = this.currentCreationPayload();
    return current.user_ci !== original.user_ci ||
      current.observacion !== original.observacion ||
      current.numero_carta !== original.numero_carta;
  }

  get canStartNewOperation(): boolean {
    return this.creationAttempt?.state === 'uncertain' || this.creationAttempt?.state === 'conflict';
  }

  get requiresAttemptDecision(): boolean {
    return !this.data && this.canStartNewOperation;
  }

  async save() { 
    if (this.form.invalid || this.saving || this.usersLoading) return;

    if (!this.data && this.requiresAttemptDecision) {
      return;
    }

    this.errorTitle = '';
    this.errorMessage = '';

    if (this.data) {
      this.saving = true;
      const updateData: UpdateLetterNumberModel = {
        user_ci: Number(this.form.value.user_ci),
        observacion: this.form.value.observacion
      };

      try {
        await this.updateUseCase.execute(this.data.id, updateData);
        this.dialogRef.close(true);
      } catch (error: unknown) {
        console.error('Error al actualizar carta:', error);
        const errorContent = getInstitutionalNumberError(
          error,
          false,
          'No se pudo actualizar la carta.'
        );
        this.errorTitle = errorContent.title;
        this.errorMessage = errorContent.message;
      } finally {
        this.saving = false;
      }

    } else {
      await this.beginCreation(this.currentCreationPayload());
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
      'El primer documento podría haberse creado. Revisa el listado antes de iniciar una nueva solicitud con los datos actuales. ¿Deseas continuar?'
    );
    if (!confirmed) return;

    this.creationAttempt = null;
    this.errorTitle = '';
    this.errorMessage = '';
    await this.beginCreation(this.currentCreationPayload());
  }


  close(): void {
    if (this.creationAttempt?.state === 'uncertain') {
      const confirmed = window.confirm(
        'El resultado de la operación no está confirmado. Si cierras, ya no podrás reintentar con la misma clave desde este formulario. ¿Deseas cerrar?'
      );
      if (!confirmed) return;
    }

    this.invalidatePendingAttempt();
    this.dialogRef.close();
  }

  private async beginCreation(payload: CreateLetterNumberModel): Promise<void> {
    const actorCi = this.authService.getCurrentUser()?.ci;
    if (actorCi === undefined ||
      this.sessionGeneration !== this.idempotencySession.currentGeneration) {
      this.errorTitle = 'Sesión no disponible';
      this.errorMessage = 'No se pudo asociar la operación a la sesión actual. Vuelve a iniciar sesión.';
      return;
    }

    try {
      const attempt = createCreationAttempt(
        'letter-number',
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

  private currentCreationPayload(): CreateLetterNumberModel {
    return {
      user_ci: Number(this.form.value.user_ci),
      observacion: this.form.value.observacion
    };
  }

  private async sendCreationAttempt(attempt: CreationAttempt<CreateLetterNumberModel>): Promise<void> {
    const version = this.operationVersion;
    attempt.state = 'sending';
    this.saving = true;
    this.errorTitle = '';
    this.errorMessage = '';

    try {
      const response = await this.createUseCase.execute(attempt.payload, attempt.key);
      if (!this.isCurrentAttempt(attempt, version)) return;

      attempt.state = 'confirmed';
      this.creationAttempt = null;
      this.generatedNumber = response.numero_carta;
      this.dialogRef.close(true);
    } catch (error: unknown) {
      if (!this.isCurrentAttempt(attempt, version)) return;

      console.error('Error al crear carta:', error);
      const errorContent = getInstitutionalNumberError(
        error,
        false,
        'No se pudo crear la carta.',
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
    } finally {
      if (version === this.operationVersion) {
        this.saving = false;
      }
    }
  }

  private isCurrentAttempt(
    attempt: CreationAttempt<CreateLetterNumberModel>,
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
