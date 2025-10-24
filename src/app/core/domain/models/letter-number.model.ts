export interface LetterNumberModel {
    id: number;
    numero_carta: string;
    user_ci: number;
    fecha: Date;
    observacion?: string;
    user?: {
        ci: number;
        nomre: string;
    };
}

export interface CreateLetterNumberModel {
    numero_carta: string;
    user_ci: number;
    observacion?: string;
}