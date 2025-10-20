import { Injectable } from "@angular/core";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";
import { SealNumberModel } from "../../../domain/models/seal-number.model";

@Injectable({ 
    providedIn: "root" 
})
export class GetSealNumberByIdUseCase {
    constructor(private repository: SealNumbersRepository) {}
    
    execute(id: number): Promise<SealNumberModel> {
        return this.repository.getById(id);
    }
}