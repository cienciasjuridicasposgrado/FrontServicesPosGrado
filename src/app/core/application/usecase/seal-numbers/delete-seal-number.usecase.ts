import { Injectable } from "@angular/core";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteSealNumberUseCase {
    constructor(private repository: SealNumbersRepository) {}

    execute(id: number): Promise<void> {
        return this.repository.delete(id);
    }
}