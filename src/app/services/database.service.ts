import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// Interfaces para tipos de datos
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

export interface VehicleRecord {
  id: number;
  placa: string;
  entry_time: string;
  exit_time?: string;  // Opcional para activos
  estudiante_matricula: string;  // ← Nombre correcto del campo
  duration?: string;   // Solo para históricos
}

// Interfaz para respuesta de API
interface ApiResponse {
  results: StudentData[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly apiUrl = 'http://localhost:8000/api/';
  private readonly estudiantesEndpoint = 'estudiantes/';
  private readonly vehiculosEndpoint = 'registros-activos';
  private readonly historialEndpoint = 'registros-historicos/';

  constructor(private http: HttpClient) { }

  getStudents(page: number, pageSize: number, sortOptions?: SortOptions): Observable<{ results: StudentData[], count: number }> {
    let params = new HttpParams()
      .set('page', (page + 1).toString())
      .set('page_size', pageSize.toString());

    if (sortOptions?.active && sortOptions.direction) {
      params = params.set('ordering', `${sortOptions.direction === 'desc' ? '-' : ''}${sortOptions.active}`);
    }

    return this.http.get<ApiResponse>(`${this.apiUrl}${this.estudiantesEndpoint}`, { params }).pipe(
      map(response => ({
        results: response.results,
        count: response.count
      })),
      catchError(this.handleError('Error obteniendo estudiantes'))
    );
  }

  // Cambiar el método searchStudents
searchStudents(term: string, page: number = 0, pageSize: number = 10): Observable<{ results: StudentData[], count: number }> {
  const params = new HttpParams()
    .set('q', term) // ← Usar 'q' en lugar de 'search'
    .set('page', (page + 1).toString()) // El backend usa paginación 1-indexada
    .set('page_size', pageSize.toString());

  // Usar el endpoint específico de búsqueda
  return this.http.get<ApiResponse>(`${this.apiUrl}${this.estudiantesEndpoint}buscar/`, { params }).pipe(
    map(response => ({
      results: response.results,
      count: response.count
    })),
    catchError(error => {
      console.error('Error en searchStudents:', error);
      return throwError(() => new Error('Error en la búsqueda'));
    })
  );
}

  // Corregir endpoints y parámetros
  getActiveRecords(matricula: string): Observable<VehicleRecord[]> {
    const params = new HttpParams()
      .set('estudiante_matricula', matricula);

    // ahora apiUrl + vehiculosEndpoint → 'http://localhost:8000/api/registros-activos/'
    const url = `${this.apiUrl}/${this.vehiculosEndpoint}`;

    return this.http.get<VehicleRecord[]>(url, { params }).pipe(
      tap(data => console.log('Registros activos raw:', data)), // opcional: para debug
      catchError(this.handleError('Error obteniendo registros activos'))
    );
  }

getHistoricalRecords(matricula: string): Observable<VehicleRecord[]> {
  const params = new HttpParams()
    .set('estudiante_matricula', matricula); // ← Parámetro corregido

  return this.http.get<VehicleRecord[]>(
    `${this.apiUrl}registros-historicos`, // ← Endpoint corregido
    { params }
  ).pipe(
    catchError(this.handleError('Error obteniendo historial'))
  );
}

  registerVehicleEntry(matricula: string, placa: string): Observable<VehicleRecord> {
    const body = {
      estudiante_matricula: matricula, // ← Campo corregido
      placa: placa.toUpperCase()
    };

    return this.http.post<VehicleRecord>(
      `${this.apiUrl}registros-activos/`, // ← Endpoint corregido
      body
    ).pipe(
      catchError(this.handleError('Error registrando entrada'))
    );
  }

  registerVehicleExit(registroId: number): Observable<VehicleRecord> {
    return this.http.post<VehicleRecord>(
      `${this.apiUrl}registros-activos/${registroId}/registrar_salida/`, // ← Endpoint corregido
      {}
    ).pipe(
      catchError(this.handleError('Error registrando salida'))
    );
  }

  private handleError(operation = 'Operación') {
    return (error: any): Observable<never> => {
      console.error(`${operation}:`, error);
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      return throwError(() => new Error(`${operation} falló: ${errorMessage}`));
    };
  }
}
