import { Injectable } from "@angular/core";
import { DepartamentosRepository } from "../../../domain/repositories/departamentos.repository";

@Injectable({ 
    providedIn: 'root' 
})
export class DeleteDepartamentoUseCase {
  constructor(private departamentosRepository: DepartamentosRepository) {}

  async execute(id: number): Promise<void> {
    if (id <= 5) { 
        return Promise.reject(new Error("No se pueden eliminar departamentos preestablecidos."));
    }
    return this.departamentosRepository.deleteDepartamento(id);
  }
}