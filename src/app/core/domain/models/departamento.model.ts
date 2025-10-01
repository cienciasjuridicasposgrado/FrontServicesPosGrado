export interface DepartamentoModel {
    id: number;
    nombre: string;
    descripcion?: string;
}

export interface CreateDepartamentoModel extends Omit<DepartamentoModel, 'id'> {}

export interface UpdateDepartamentoModel extends Partial<CreateDepartamentoModel> {}