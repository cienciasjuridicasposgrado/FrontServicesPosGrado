export interface Role {
    id: number;
    name: string;
    description?: string;
    can_make_entry: boolean;
    can_generate_seals: boolean;
    can_generate_letters: boolean;
}