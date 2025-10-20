import { Injectable } from "@angular/core";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class SetStartNumberUseCase {
    constructor(private repository: SealNumbersRepository) {}

    execute(start: number): Promise<{ message: string }> {
        if (start < 0) throw new Error("El número inicial no puede ser negativo");
        return this.repository.setStartNumber(start);
    }
}