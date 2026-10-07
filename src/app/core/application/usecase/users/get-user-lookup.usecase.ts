import { Injectable } from '@angular/core';
import { UserLookupModel } from '../../../domain/models/user-lookup.model';
import { UsersRepository } from '../../../domain/repositories/users.repository';

@Injectable({
  providedIn: 'root'
})
export class GetUserLookupUseCase {
  constructor(private usersRepository: UsersRepository) {}

  execute(): Promise<UserLookupModel[]> {
    return this.usersRepository.getLookup();
  }
}
