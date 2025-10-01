export interface RoleModel {
    id: number;
    name: string;
    description: string;
    can_make_entry: boolean;
    can_make_seals: boolean;
    can_make_letter: boolean;
}

/**
 * Interfaz para la creación de un Role (DTO de entrada).
 * Omite el 'id' porque lo genera la BD.
 */
export interface CreateRoleModel extends Omit<RoleModel, 'id'> {}

/**
 * Interfaz para la actualización de un Role.
 * Permite que todos los campos sean opcionales.
 */
export interface UpdateRoleModel extends Partial<CreateRoleModel> {}