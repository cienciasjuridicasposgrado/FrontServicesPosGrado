export interface SealNumberModel {
    id: number;
    numeroSello: string;
    user_ci: number;
    fecha: string;
    observacion?: string;
}

export interface CreateSealNumberModel {
    numeroSello?: string;
    user_ci: number;
    observacion?: string;
}