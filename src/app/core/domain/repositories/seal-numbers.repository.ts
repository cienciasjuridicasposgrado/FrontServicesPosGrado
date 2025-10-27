import { CreateSealNumberModel, SealNumberModel, UpdateSealNumberModel } from "../models/seal-number.model";

export abstract class SealNumbersRepository {
  abstract getAll(): Promise<SealNumberModel[]>;
  abstract getById(id: number): Promise<SealNumberModel>;
  abstract create(data: CreateSealNumberModel): Promise<SealNumberModel>;
  abstract update(id: number, data: UpdateSealNumberModel): Promise<SealNumberModel>;
  abstract delete(id: number): Promise<void>;
}