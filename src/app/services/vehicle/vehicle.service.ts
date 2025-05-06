import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface VehicleRecord {
    id: number;
    placa: string;
    estudiante_matricula: string;
    entry_time: string;
}

export interface VehicleHistory {
    id: number;
    placa: string;
    entry_time: string;
    exit_time: string;
    duration: string;
}

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    private apiUrl = 'http://127.0.0.1:8000/api/';

    constructor(private http: HttpClient) { }

    // Registrar entrada de vehículo
    registerVehicleEntry(placa: string, matricula: string): Observable<VehicleRecord> {
        return this.http.post<VehicleRecord>(`${this.apiUrl}registros-activos/`, {
            placa: placa.toUpperCase(),
            estudiante_matricula: matricula
        }).pipe(
            catchError(this.handleError)
        );
    }

    // Registrar salida de vehículo
    registerVehicleExit(recordId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}registros-activos/${recordId}/registrar_salida/`, {})
            .pipe(
                catchError(this.handleError)
            );
    }

    // Obtener registros activos
    getActiveVehicleRecords(matricula: string): Observable<VehicleRecord[]> {
        return this.http.get<{ results: VehicleRecord[] }>(`${this.apiUrl}registros-activos/?estudiante_matricula=${matricula}`)
            .pipe(
                map(response => response.results),
                catchError(this.handleError)
            );
    }

    // Obtener historial
    getHistoricalVehicleRecords(matricula: string): Observable<VehicleHistory[]> {
        return this.http.get<{ results: VehicleHistory[] }>(`${this.apiUrl}registros-historicos/?matricula=${matricula}`)
            .pipe(
                map(response => response.results),
                catchError(this.handleError)
            );
    }

    private handleError(error: any): Observable<never> {
        let errorMessage = 'Error desconocido';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error del cliente: ${error.error.message}`;
        } else {
            errorMessage = `Error ${error.status}: ${error.message}`;
        }
        console.error('Detalle del error:', error);
        return throwError(() => new Error(errorMessage));
    }
}
