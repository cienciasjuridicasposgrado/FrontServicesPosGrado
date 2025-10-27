import { Injectable } from "@angular/core";
import { LetterNumberModel, UpdateLetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateLetterNumberUseCase {
    constructor(private repo: LetterNumbersRepository) {}

    execute(id: number, data: UpdateLetterNumberModel): Promise<LetterNumberModel> {
        return this.repo.update(id, data);
    }
}