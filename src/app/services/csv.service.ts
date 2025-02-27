import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
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

    const fullUrl = this.resolveUrl(url);
    console.log('Iniciando carga de CSV desde:', fullUrl);

    return new Observable((observer) => {
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
            console.error('Status:', error.status);
            console.error('URL completa:', fullUrl);
            console.error('Mensaje de error:', error.message);
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (data) => {
            console.log('Datos recibidos, longitud:', data.length);
            try {
              Papa.parse<CsvRow>(data, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                  console.log('Parsing completado. Filas:', result.data.length);
                  if (result.data.length > 0) {
                    const firstRow = result.data[0];
                    console.log('Muestra de primera fila:', firstRow);
                    if (firstRow && typeof firstRow === 'object') {
                      console.log('Columnas detectadas:', Object.keys(firstRow));
                    }
                  }
                  observer.next(result.data);
                  observer.complete();
                },
                error: (error: Error) => {
                  console.error('Error en el parsing:', error);
                  observer.error(error);
                }
              });
            } catch (e) {
              console.error('Error intentando parsear CSV:', e);
              observer.error(e);
            }
          },
          error: (err) => {
            console.error('Error en la subscripción:', err);
            observer.error(err);
          }
        });
    });
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
    
    console.log('Utilizando datos de demostración como respaldo');
    return of(datosDemostracion);
  }
}