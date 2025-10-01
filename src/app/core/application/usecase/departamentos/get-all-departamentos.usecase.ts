import { Injectable } from "@angular/core";
import { DepartamentosRepository } from "../../../domain/repositories/departamentos.repository";
import { DepartamentoModel } from "../../../domain/models/departamento.model";

@Injectable({
    providedIn: 'root'
})
export class GetAllDepartamentosUseCase {
    constructor(private departamentosRepository: DepartamentosRepository) {}

    execute(): Promise<DepartamentoModel[]> {
        return this.departamentosRepository.getAllDepartamentos();
    }
}