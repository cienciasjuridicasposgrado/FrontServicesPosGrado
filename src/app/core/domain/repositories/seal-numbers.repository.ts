import { UpdateSealNumberUseCase } from "../../application/usecase/seal-numbers/update-seal-number.usecase";
import { CreateSealNumberModel, SealNumberModel } from "../models/seal-number.model";

export abstract class SealNumbersRepository {
  abstract getAll(): Promise<SealNumberModel[]>;
  abstract getById(id: number): Promise<SealNumberModel>;
  abstract create(data: CreateSealNumberModel): Promise<SealNumberModel>;
  abstract update(id: number, data: SealNumberModel): Promise<SealNumberModel>;
  abstract delete(id: number): Promise<void>;
}