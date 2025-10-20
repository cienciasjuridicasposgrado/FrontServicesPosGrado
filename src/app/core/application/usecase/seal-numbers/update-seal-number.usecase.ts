import { Injectable } from "@angular/core";
import { UpdateSealNumberModel, SealNumberModel } from "../../../domain/models/seal-number.model";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class UpdateSealNumberUseCase {
    constructor(private repository: SealNumbersRepository) {}

    execute(id: number, data: UpdateSealNumberModel): Promise<SealNumberModel> {
        return this.repository.update(id, data);
    }
}