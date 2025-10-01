import { Injectable } from "@angular/core";
import { DepartamentoModel } from "../../../domain/models/departamento.model";
import { DepartamentosRepository } from "../../../domain/repositories/departamentos.repository";


@Injectable({ 
    providedIn: 'root' 
})
export class GetDepartamentoByIdUseCase {
    constructor(private departamentosRepository: DepartamentosRepository) {}

    execute(id: number): Promise<DepartamentoModel> {
        return this.departamentosRepository.getDepartamentoById(id);
    }
}