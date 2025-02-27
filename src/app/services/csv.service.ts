import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, of, BehaviorSubject } from 'rxjs';
import * as Papa from 'papaparse';
import { isPlatformBrowser } from '@angular/common';

interface CsvRow {
  Matricula: string;
  'Apellido Paterno': string;
  'Apellido Materno': string;
  Nombre: string;
  Email: string;
  [key: string]: string; // Para cualquier columna adicional
}

@Injectable({
  providedIn: 'root',
})
export class CsvService {
  private isBrowser: boolean;
  private readonly baseUrl: string = '/';
  private dataSubject = new BehaviorSubject<CsvRow[]>([]);
  private isLoading = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  cargarCSV(url: string): Observable<CsvRow[]> {
    if (!this.isBrowser) {
      console.log('Ejecutando en el servidor, retornando datos de demostración');
      return this.getDatosDemostracion();
    }

    // Si ya estamos cargando, retornamos el observable actual
    if (this.isLoading) {
      return this.dataSubject.asObservable();
    }

    this.isLoading = true;
    const fullUrl = this.resolveUrl(url);
    console.log('Iniciando carga de CSV desde:', fullUrl);

    this.http.get(fullUrl, { 
      responseType: 'text',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en la petición HTTP:', error);
        this.isLoading = false;
        return throwError(() => error);
      })
    ).subscribe({
      next: (data) => {
        try {
          const results: CsvRow[] = [];
          Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
              console.log('Parsing completado');
              this.dataSubject.next(result.data as CsvRow[]);
              this.isLoading = false;
            },
            error: (error: Error) => {
              console.error('Error en el parsing:', error);
              this.isLoading = false;
              this.dataSubject.error(error);
            }
          });
        } catch (e) {
          console.error('Error intentando parsear CSV:', e);
          this.isLoading = false;
          this.dataSubject.error(e);
        }
      },
      error: (err) => {
        console.error('Error en la subscripción:', err);
        this.isLoading = false;
        this.dataSubject.error(err);
      }
    });

    return this.dataSubject.asObservable();
  }

  private resolveUrl(url: string): string {
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    return this.baseUrl + url.replace(/^\/+/, '');
  }

  getDatosDemostracion(): Observable<CsvRow[]> {
    const datosDemostracion: CsvRow[] = [
      { 
        Matricula: '202240506',
        'Apellido Paterno': 'HERNANDEZ',
        'Apellido Materno': 'CRUZ',
        Nombre: 'MARIA',
        Email: 'ejemplo@correo.com'
      },
      {
        Matricula: '202240507',
        'Apellido Paterno': 'LOPEZ',
        'Apellido Materno': 'GARCIA',
        Nombre: 'JUAN',
        Email: 'ejemplo2@correo.com'
      },
      {
        Matricula: '202240508',
        'Apellido Paterno': 'MARTINEZ',
        'Apellido Materno': 'RODRIGUEZ',
        Nombre: 'ANA',
        Email: 'ejemplo3@correo.com'
      }
    ];
    
    this.dataSubject.next(datosDemostracion);
    return this.dataSubject.asObservable();
  }
}