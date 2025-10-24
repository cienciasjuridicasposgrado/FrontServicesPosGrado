import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreateLetterNumberModel, LetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateLetterNumberUseCase {
    constructor(private repo: LetterNumbersRepository) {}

    execute(id: number, data: Partial<CreateLetterNumberModel>): Observable<LetterNumberModel> {
        return this.repo.update(id, data);
    }
}