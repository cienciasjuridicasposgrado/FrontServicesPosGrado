import { Injectable } from "@angular/core";
import { DepartamentosRepository } from "../../../domain/repositories/departamentos.repository";
import { CreateDepartamentoModel, DepartamentoModel } from "../../../domain/models/departamento.model";

@Injectable({
    providedIn: 'root'
})
export class CreateDepartamentoUseCase {
    constructor(private departamentosRepository: DepartamentosRepository) {}

    execute(departamento: CreateDepartamentoModel): Promise<DepartamentoModel> {
        if (!departamento.nombre || !/^[A-Z]/.test(departamento.nombre))
        {
            throw new Error("El nombre del departamento debe comenzar con mayuscula");
        }

        return this.departamentosRepository.createDepartamento(departamento);
    }
}