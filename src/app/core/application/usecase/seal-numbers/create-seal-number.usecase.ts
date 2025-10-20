import { Injectable } from "@angular/core";
import { CreateSealNumberModel, SealNumberModel } from "../../../domain/models/seal-number.model";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class CreateSealNumberUseCase {
    constructor(private repository: SealNumbersRepository) {}

    execute(data: CreateSealNumberModel): Promise<SealNumberModel> {
        if (!data.user_ci) throw new Error("Debe especificar el usuario que genera el sello");
        return this.repository.create(data);
    }
}