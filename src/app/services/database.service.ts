import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface StudentData {
  matricula: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre: string;
  email: string;
}

export interface SortOptions {
  active: keyof StudentData;
  direction: 'asc' | 'desc' | '';
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly apiUrl = 'http://localhost:8000/api/estudiantes/';

  constructor(private http: HttpClient) { }

  getStudents(page: number, pageSize: number, sortOptions?: SortOptions): Observable<{ results: StudentData[], count: number }> {
    let params = new HttpParams()
      .set('page', (page + 1).toString())
      .set('page_size', pageSize.toString());

    if (sortOptions?.active && sortOptions.direction) {
      params = params.set('ordering', `${sortOptions.direction === 'desc' ? '-' : ''}${sortOptions.active}`);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => ({
        results: response.results,
        count: response.count
      })),
      catchError(error => {
        console.error('Error al obtener estudiantes:', error);
        return throwError(() => new Error('Error al cargar los datos. Por favor intente nuevamente.'));
      })
    );
  }

  searchStudents(term: string, page: number = 0, pageSize: number = 10): Observable<{ results: StudentData[], count: number }> {
    const params = new HttpParams()
      .set('search', term)
      .set('page', (page + 1).toString())
      .set('page_size', pageSize.toString());

    return this.http.get<any>(`${this.apiUrl}search/`, { params }).pipe(
      map(response => ({
        results: response.results,
        count: response.count
      })),
      catchError(error => {
        console.error('Error en la búsqueda:', error);
        return throwError(() => new Error('Error al realizar la búsqueda. Por favor intente nuevamente.'));
      })
    );
  }
}