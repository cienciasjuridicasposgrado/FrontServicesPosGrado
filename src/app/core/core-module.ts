import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthRepository } from './domain/repositories/auth.repository';
import { ApiAuthRepository } from './infrastructure/repositories/auth/apiAuth.repository';
import { AuthInterceptor } from './infrastructure/interceptors/auth.interceptor';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    { provide: AuthRepository, useClass: ApiAuthRepository },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class CoreModule { 
  constructor(@Optional() @SkipSelf() parentModuel: CoreModule) {
    if (parentModuel) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
