import { DepartamentoModel, CreateDepartamentoModel, UpdateDepartamentoModel } from "../models/departamento.model";

export abstract class DepartamentosRepository {
    abstract getAllDepartamentos(): Promise<DepartamentoModel[]>;

    abstract getDepartamentoById(id: number): Promise<DepartamentoModel>;

    abstract createDepartamento(departamento: CreateDepartamentoModel): Promise<DepartamentoModel>;

    abstract updateDepartamento(id: number, departamento: UpdateDepartamentoModel): Promise<DepartamentoModel>;

    abstract deleteDepartamento(id: number): Promise<void>;
}