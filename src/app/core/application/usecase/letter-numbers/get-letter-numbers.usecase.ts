import { Injectable } from "@angular/core";
import { LetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetLetterNumbersUseCase {
    constructor(private repo: LetterNumbersRepository) {}

    execute(): Promise<LetterNumberModel[]> {
        return this.repo.getAll();
    }
}