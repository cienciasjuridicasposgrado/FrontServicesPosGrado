import { LetterNumberModel, CreateLetterNumberModel, UpdateLetterNumberModel } from "../models/letter-number.model";

export abstract class LetterNumbersRepository {
  abstract getAll(): Promise<LetterNumberModel[]>;
  abstract getById(id: number): Promise<LetterNumberModel>;
  abstract create(data: CreateLetterNumberModel): Promise<LetterNumberModel>;
  abstract update(id: number, data: UpdateLetterNumberModel): Promise<LetterNumberModel>;
  abstract delete(id: number): Promise<void>;
}