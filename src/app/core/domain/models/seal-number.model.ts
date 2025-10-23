export interface SealNumberModel {
    id: number;
    numeroSello: string;
    user_ci: number;
    userName: string;
    fecha: string;
    observacion?: string;
}

export interface CreateSealNumberModel {
    user_ci: number;
    observacion?: string;
    numeroSello?: string;
}

export interface UpdateSealNumberModel {
    numeroSello?: string;
    user_ci?: number;
    observacion?: string;
}