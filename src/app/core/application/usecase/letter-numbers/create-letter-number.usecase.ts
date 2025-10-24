import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreateLetterNumberModel, LetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateLetterNumberUseCase {
    constructor(private repo: LetterNumbersRepository) {}

    execute(data: CreateLetterNumberModel): Observable<LetterNumberModel> {
        return this.repo.create(data);
    }
}