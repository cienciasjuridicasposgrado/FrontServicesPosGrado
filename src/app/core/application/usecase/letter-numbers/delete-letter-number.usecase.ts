import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteLetterNumberUseCase {
  constructor(private repo: LetterNumbersRepository) {}

  execute(id: number): Observable<void> {
    return this.repo.delete(id);
  }
}