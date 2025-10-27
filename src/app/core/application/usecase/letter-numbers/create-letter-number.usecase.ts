import { Injectable } from "@angular/core";
import { CreateLetterNumberModel, LetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateLetterNumberUseCase {
    constructor(private repo: LetterNumbersRepository) {}

    execute(data: CreateLetterNumberModel): Promise<LetterNumberModel> {
        return this.repo.create(data);
    }
}