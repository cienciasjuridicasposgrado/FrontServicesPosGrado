import { Injectable } from "@angular/core";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";
import { SealNumberModel } from "../../../domain/models/seal-number.model";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateSealNumberUseCase {
    constructor(private repository: SealNumbersRepository) {}

    execute(id: number, seal: SealNumberModel): Promise<SealNumberModel> {
        return this.repository.update(id, seal);
    }
}