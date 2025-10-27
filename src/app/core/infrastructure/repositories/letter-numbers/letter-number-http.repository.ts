import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { lastValueFrom, Observable } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { LetterNumberModel, CreateLetterNumberModel, UpdateLetterNumberModel } from "../../../domain/models/letter-number.model";
import { LetterNumbersRepository } from "../../../domain/repositories/letter-numbers.repository";

@Injectable()
export class LetterNumberHttpRepository extends LetterNumbersRepository {
    private apiBaseUrl = environment.apiUrl + "/letter-numbers";

    constructor(private http: HttpClient) {
        super();
    }

    getAll(): Promise<LetterNumberModel[]> {
        const letters$: Observable<LetterNumberModel[]> = this.http.get<LetterNumberModel[]>(this.apiBaseUrl);
        return lastValueFrom(letters$);
    }

    getById(id: number): Promise<LetterNumberModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const letter$: Observable<LetterNumberModel> = this.http.get<LetterNumberModel>(url);
        return lastValueFrom(letter$);
    }

    create(letter: CreateLetterNumberModel): Promise<LetterNumberModel> {
        const letter$: Observable<LetterNumberModel> = this.http.post<LetterNumberModel>(this.apiBaseUrl, letter);
        return lastValueFrom(letter$);
    }

    update(id: number, data: UpdateLetterNumberModel): Promise<LetterNumberModel> {
        const url = `${this.apiBaseUrl}/${id}`;
        const letter$: Observable<LetterNumberModel> = this.http.put<LetterNumberModel>(url, data);
        return lastValueFrom(letter$);
    }

    delete(id: number): Promise<void> {
        const url = `${this.apiBaseUrl}/${id}`;
        const response$: Observable<void> = this.http.delete<void>(url);
        return lastValueFrom(response$);
    }
}