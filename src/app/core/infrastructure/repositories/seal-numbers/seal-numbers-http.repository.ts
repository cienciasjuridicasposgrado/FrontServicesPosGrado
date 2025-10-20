import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";
import { CreateSealNumberModel, SealNumberModel } from "../../../domain/models/seal-number.model";
import { firstValueFrom } from "rxjs";

@Injectable({ 
  providedIn: "root" 
})
export class SealNumbersRepositoryImpl extends SealNumbersRepository {
  private readonly apiUrl = `${environment.apiUrl}/seal-numbers`;

  constructor(private http: HttpClient) { 
    super(); 
  }

  async getAll(): Promise<SealNumberModel[]> {
    return await firstValueFrom(this.http.get<SealNumberModel[]>(this.apiUrl));
  }

  async getById(id: number): Promise<SealNumberModel> {
    return await firstValueFrom(this.http.get<SealNumberModel>(`${this.apiUrl}/${id}`));
  }

  async create(data: CreateSealNumberModel): Promise<SealNumberModel> {
    return await firstValueFrom(this.http.post<SealNumberModel>(this.apiUrl, data));
  }

  async update(id: number, data: Partial<CreateSealNumberModel>): Promise<SealNumberModel> {
    return await firstValueFrom(this.http.patch<SealNumberModel>(`${this.apiUrl}/${id}`, data));
  }

  async delete(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}