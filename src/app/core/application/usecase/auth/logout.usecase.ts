import { Injectable } from "@angular/core";
import { catchError, Observable, of, tap } from "rxjs";
import { AuthRepository } from "../../../domain/repositories/auth.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class LogoutUseCase {
    constructor(private authRepository: AuthRepository) {}

    execute(): Observable<any> {
        return this.authRepository.logout().pipe(
            tap(() => {
            console.log('Logout exitoso en servidor');
            }),
            catchError((error) => {
            // Silenciar el error 401 ya que es esperado cuando el token expira
            if (error.status !== 401) {
                console.warn('Error durante logout del servidor:', error);
            }
            return of({ success: true, message: 'Sesión cerrada' });
            })
        );
    }
}