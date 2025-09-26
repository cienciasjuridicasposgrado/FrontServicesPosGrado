import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { AuthService } from "../../../../core/application/services/auth.service";
import { Router, RouterModule } from "@angular/router";
import { LoginRequest } from "../../../../core/domain/models/user.model";
import { NotificationService } from "../../../../shared/services/notification.service";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm: FormGroup;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private notificationService: NotificationService
    ) {
        this.loginForm = this.fb.group({
            ci: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.min(1)]],
            password: ['', [Validators.required, Validators.minLength(4)]]
        });
    }

    ngOnInit(): void {
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.loading = true;
            const loginData: LoginRequest = this.loginForm.value;

            this.authService.login(loginData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (response) => {
                        this.loading = false;
                        this.router.navigate(['/dashboard']);
                        this.notificationService.showSuccess(`Bienvenido ${response.user.nombre}`);
                    },
                    error: (error) => {
                        this.loading = false;
                        const message = error.error?.message || 'Error al iniciar sesion';
                        this.notificationService.showError(message);
                    }
                });
        } else {
            this.markFormGroupTouched();
        }
    }

    private markFormGroupTouched(): void {
        Object.keys(this.loginForm.controls).forEach(key => {
            this.loginForm.get(key)?.markAsTouched();
        });
    }

    get ci() {
        return this.loginForm.get('ci');
    }

    get password() {
        return this.loginForm.get('password');
    }
}