import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/application/services/auth.service';
import { UserModel } from '../../../../core/domain/models/user.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const user: UserModel = { ci: 123, nombre: 'Ada', role_id: 1 };
  let authService: jasmine.SpyObj<AuthService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    notifications = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['showSuccess', 'showError']
    );

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notifications }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('navigates using the user hydrated by AuthService without reading response.user', () => {
    authService.login.and.returnValue(of(user));
    const navigateByUrl = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.loginForm.setValue({ ci: 123, password: 'secret' });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ ci: 123, password: 'secret' });
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(notifications.showSuccess).toHaveBeenCalledWith('Bienvenido Ada');
    expect(component.loading).toBeFalse();
  });
});
