import { Injectable } from "@angular/core";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteLetterNumberUseCase {
  constructor(private repo: LetterNumbersRepository) {}

  execute(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}