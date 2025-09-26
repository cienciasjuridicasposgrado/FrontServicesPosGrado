export interface Role {
    id: number;
    name: string;
    description: string;
    can_make_entry: boolean;
    can_make_seals: boolean;
    can_make_letter: boolean;
    created_at?: string;
    updated_at?:string;
}