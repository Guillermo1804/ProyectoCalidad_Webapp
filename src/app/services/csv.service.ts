import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, of, BehaviorSubject, map } from 'rxjs';
import * as Papa from 'papaparse';
import { ParseResult } from 'papaparse';
import { isPlatformBrowser } from '@angular/common';

interface CsvRow {
  Matricula: string;
  'Apellido Paterno': string;
  'Apellido Materno': string;
  Nombre: string;
  Email: string;
  [key: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class CsvService {
  private isBrowser: boolean;
  private readonly baseUrl: string = '/';
  private dataSubject = new BehaviorSubject<CsvRow[]>([]);
  private isLoading = false;
  private readonly CHUNK_SIZE = 1000;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  cargarCSV(url: string): Observable<CsvRow[]> {
    if (!this.isBrowser) {
      return this.getDatosDemostracion();
    }

    // Si ya estamos cargando, retornamos el observable actual
    if (this.isLoading) {
      return this.dataSubject.asObservable();
    }

    this.isLoading = true;
    const fullUrl = this.resolveUrl(url);

    this.http.get(fullUrl, { 
      responseType: 'text',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.isLoading = false;
        return throwError(() => error);
      })
    ).subscribe({
      next: (csvText: string) => {
        try {
          const allData: CsvRow[] = [];
          Papa.parse<CsvRow>(csvText, {
            header: true,
            skipEmptyLines: true,
            chunk: (result: ParseResult<CsvRow>) => {
              if (result.data && result.data.length > 0) {
                allData.push(...result.data);
                // Emitir actualizaciones parciales
                if (allData.length % this.CHUNK_SIZE === 0) {
                  this.dataSubject.next([...allData]);
                }
              }
            },
            complete: () => {
              this.dataSubject.next(allData);
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
    
    return of(datosDemostracion);
  }
}