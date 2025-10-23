import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";
import { CreateSealNumberModel, SealNumberModel } from "../../../domain/models/seal-number.model";
import { lastValueFrom, Observable } from "rxjs";
import { UpdateSealNumberUseCase } from "../../../application/usecase/seal-numbers/update-seal-number.usecase";

@Injectable()
export class SealNumbersRepositoryImpl extends SealNumbersRepository {
  private apiBaseUrl = environment.apiUrl + "/seal-numbers";

  constructor(private http: HttpClient) { 
    super(); 
  }

  getAll(): Promise<SealNumberModel[]> {
    const seals$: Observable<SealNumberModel[]> = this.http.get<SealNumberModel[]>(this.apiBaseUrl);
    return lastValueFrom(seals$);
  }

  getById(id: number): Promise<SealNumberModel> {
    const url = `${this.apiBaseUrl}/${id}`;
    const seal$: Observable<SealNumberModel> = this.http.get<SealNumberModel>(url);
    return lastValueFrom(seal$);
  }

  create(seal: CreateSealNumberModel): Promise<SealNumberModel> {
    const seal$: Observable<SealNumberModel> = this.http.post<SealNumberModel>(this.apiBaseUrl, seal);
    return lastValueFrom(seal$);
  }

  update(id: number, seal: SealNumberModel): Promise<SealNumberModel> {
    const url = `${this.apiBaseUrl}/${id}`;
    const seal$: Observable<SealNumberModel> = this.http.put<SealNumberModel>(url, seal);
    return lastValueFrom(seal$);
  }

  delete(id: number): Promise<void> {
    const url = `${this.apiBaseUrl}/${id}`;
    const response$: Observable<void> = this.http.delete<void>(url);
    return lastValueFrom(response$);
  }
}