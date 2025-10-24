import { Observable } from "rxjs";
import { LetterNumberModel, CreateLetterNumberModel } from "../models/letter-number.model";

export abstract class LetterNumbersRepository {
  abstract getAll(): Observable<LetterNumberModel[]>;
  abstract getById(id: number): Observable<LetterNumberModel>;
  abstract create(data: CreateLetterNumberModel): Observable<LetterNumberModel>;
  abstract update(id: number, data: Partial<CreateLetterNumberModel>): Observable<LetterNumberModel>;
  abstract delete(id: number): Observable<void>;
}