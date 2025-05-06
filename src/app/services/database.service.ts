import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interface con nombres de propiedades consistentes
export interface StudentData {
  matricula: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre: string;
  email: string;
  fecha_registro: string;
}

export interface SortOptions {
  active: keyof StudentData;
  direction: 'asc' | 'desc' | '';
}

interface PaginatedResponse {
  results: StudentData[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/estudiantes/';

  constructor(private http: HttpClient) { }

  getStudents(page: number, pageSize: number, sortOptions?: SortOptions): Observable<{ results: StudentData[], count: number }> {
    let params = new HttpParams()
      .set('page', (page + 1).toString())
      .set('page_size', pageSize.toString());

    if (sortOptions?.active && sortOptions.direction) {
      const ordering = `${sortOptions.direction === 'desc' ? '-' : ''}${sortOptions.active}`;
      params = params.set('ordering', ordering);
    }

    return this.http.get<PaginatedResponse>(this.apiUrl, { params }).pipe(
      map(response => ({
        results: response.results,
        count: response.count
      })),
      catchError(this.handleError)
    );
  }

  searchStudents(term: string, page: number = 0, pageSize: number = 10): Observable<{ results: StudentData[], count: number }> {
    const params = new HttpParams()
      .set('q', term)
      .set('page', (page + 1).toString())
      .set('page_size', pageSize.toString());

    return this.http.get<PaginatedResponse>(`${this.apiUrl}buscar/`, { params }).pipe(
      map(response => ({
        results: response.results,
        count: response.count
      })),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en el servicio:', error);
    return throwError(() => new Error('Error al cargar los datos. Intente nuevamente.'));
  }
}
