import { Injectable } from "@angular/core";
import { SealNumberModel } from "../../../domain/models/seal-number.model";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class GetAllSealNumbersUseCase {
    constructor(private repository: SealNumbersRepository) {}

    execute(): Promise<SealNumberModel[]> {
        return this.repository.getAll();
    }
}