import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { LetterNumberModel, CreateLetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable({
  providedIn: 'root'
})
export class LetterNumberHttpRepository extends LetterNumbersRepository {
    private readonly apiUrl = `${environment.apiUrl}/letter-numbers`;

    constructor(private http: HttpClient) {
        super();
    }

    getAll(): Observable<LetterNumberModel[]> {
        return this.http.get<LetterNumberModel[]>(this.apiUrl);
    }

    getById(id: number): Observable<LetterNumberModel> {
        return this.http.get<LetterNumberModel>(`${this.apiUrl}/${id}`);
    }

    create(data: CreateLetterNumberModel): Observable<LetterNumberModel> {
        return this.http.post<LetterNumberModel>(this.apiUrl, data);
    }

    update(id: number, data: Partial<CreateLetterNumberModel>): Observable<LetterNumberModel> {
        return this.http.put<LetterNumberModel>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}