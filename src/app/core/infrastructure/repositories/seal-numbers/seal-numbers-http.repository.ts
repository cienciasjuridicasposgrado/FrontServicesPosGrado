import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../../environments/environment";
import { SealNumberModel, CreateSealNumberModel, UpdateSealNumberModel } from "../../../domain/models/seal-number.model";
import { SealNumbersRepository } from "../../../domain/repositories/seal-numbers.repository";

@Injectable({ providedIn: 'root' })
export class SealNumbersRepositoryImpl extends SealNumbersRepository {
    private readonly baseUrl = `${environment.apiUrl}/seal-numbers`;

    constructor(private http: HttpClient) {
        super();
    }

    getAll(): Promise<SealNumberModel[]> {
        return this.http.get<SealNumberModel[]>(this.baseUrl).toPromise();
    }

    getById(id: number): Promise<SealNumberModel> {
        return this.http.get<SealNumberModel>(`${this.baseUrl}/${id}`).toPromise();
    }

    create(data: CreateSealNumberModel): Promise<SealNumberModel> {
        return this.http.post<SealNumberModel>(this.baseUrl, data).toPromise();
    }

    update(id: number, data: UpdateSealNumberModel): Promise<SealNumberModel> {
        return this.http.put<SealNumberModel>(`${this.baseUrl}/${id}`, data).toPromise();
    }

    delete(id: number): Promise<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`).toPromise();
    }

    setStartNumber(start: number): Promise<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.baseUrl}/set-start-number?start=${start}`, {}).toPromise();
    }
}