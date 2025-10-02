import { Router } from "@angular/router";
import { LoginUseCase } from "../usecase/auth/login.usecase";
import { GetProfileUseCase } from "../usecase/auth/profile.usecase";
import { LoginRequest, LoginResponse, UserModel } from "../../domain/models/user.model";
import { BehaviorSubject, from, Observable, tap } from "rxjs";
import { Injectable } from "@angular/core";
import { LogoutUseCase } from "../usecase/auth/logout.usecase";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<UserModel | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(
      private loginUseCase: LoginUseCase,
      private logoutUseCase: LogoutUseCase,
      private profileUseCase: GetProfileUseCase,
      private router: Router
    ) {
      this.loadInitialUser();
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
      return this.loginUseCase.execute(credentials).pipe(
        tap(response => {
          localStorage.setItem('accessToken', response.accessToken);
          this.currentUserSubject.next(response.user);
        })
      );
    }

    logout(): void {
      this.logoutUseCase.execute().subscribe(() => {
        localStorage.removeItem('accessToken');
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
      });
    }

    isAuthenticated(): boolean {
      return !!localStorage.getItem('accessToken');
    }

    getCurrentUser(): UserModel | null {
      return this.currentUserSubject.value;
    }

    private loadInitialUser(): void {
      if (this.isAuthenticated() && !this.currentUserSubject.value) {
        this.profileUseCase.execute().subscribe({
          next: (user) => this.currentUserSubject.next(user),
          error: () => this.logout() 
        });
      }
    }
}