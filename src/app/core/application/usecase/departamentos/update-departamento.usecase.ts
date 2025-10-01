import { Injectable } from "@angular/core";
import { UpdateDepartamentoModel, DepartamentoModel } from "../../../domain/models/departamento.model";
import { DepartamentosRepository } from "../../../domain/repositories/departamentos.repository";


@Injectable({ 
    providedIn: 'root'
})
export class UpdateDepartamentoUseCase {
    constructor(private departamentosRepository: DepartamentosRepository) {}

    async execute(id: number, departamento: UpdateDepartamentoModel): Promise<DepartamentoModel> {
        if (departamento.nombre !== undefined && departamento.nombre.trim() === '') {
        throw new Error("El nombre del departamento no puede ser vacío.");
        }
        return this.departamentosRepository.updateDepartamento(id, departamento);
    }
}