import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { LetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetLetterNumbersUseCase {
    constructor(private repo: LetterNumbersRepository) {}

    execute(): Observable<LetterNumberModel[]> {
        return this.repo.getAll();
    }
}