import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { throwError, Observable, of } from 'rxjs';
// Make sure the path is correct; update if necessary
import { ValidatorServiceService } from './tools/validator-service.service';
import { ErrorServiceService } from './tools/error-service.service';
import { environment } from '../../environments/environment';
import { SortOptions, StudentData } from './database.service';

// Interfaces for user-specific vehicle data
export interface VehicleMovementRecord {
  id?: string;
  placa: string;
  entry_time: Date;
  exit_time?: Date;
  duration?: string;
}

export interface ActiveVehicle {
  id?: string;
  placa: string;
  entry_time: Date;
}

// Interface for User Registration Data
export interface UserRegistrationData {
  username: string; // Will typically be the email or a generated username
  email: string;
  password: string;
  first_name: string; // Corresponds to 'Nombre(s)'
  last_name: string;  // Corresponds to 'Apellido Paterno Apellido Materno'
}

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
};

//Variables para las cookies
const session_cookie_name = 'calidad-token';
const user_email_cookie_name = 'calidad-email';
const user_id_cookie_name = 'calidad-user_id';
const user_complete_name_cookie_name = 'calidad-user_complete_name';
const group_name_cookie_name = 'calidad-group_name';
const codigo_cookie_name = 'calidad-codigo';

@Injectable({
  providedIn: 'root'
})
export class FacadeServiceService {

  constructor(
    private http: HttpClient,
    public router: Router,
    private cookieService: CookieService,
    private validatorService: ValidatorServiceService,
    private errorService: ErrorServiceService,
  ) { }

  //Validar login
  //Funcion para validar login
public validarLogin(email: string, passmatricula: string) {
  const data = {
    email: email,
    matricula: passmatricula
  };
  console.log("Validando login... ", data);
  let error: any = {}; // Cambiado de [] a {}

  if(!this.validatorService.required(data.email)){
    error.email = this.errorService.required;
  } else if(!this.validatorService.max(data.email, 40)){
    error.email = this.errorService.max(40);
  } else if (!this.validatorService.email(data.email)) {
    error.email = this.errorService.email;
  }

  if(!this.validatorService.required(data.matricula)){
    error.matricula = this.errorService.required; // Cambiado de password a matricula
  }

    return error;
}

  //Servicios para login y para cerrar sesión
  //Iniciar sesión
  login(email: string, passmatricula: string): Observable<any> {
    const data = {
      username: email,
      password: passmatricula
    };
    console.log('Datos enviados al servidor:', data);  
    return this.http.post<any>(`${environment.url_api}/api/login/`, data, httpOptions);
  }

    //Cerrar sesión
    logout(): Observable<any> {
      var headers: any;
      var token = this.getSessionToken();
      headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
      return this.http.get<any>(`${environment.url_api}/api/logout/`, {headers: headers});
    }

    //Funciones para las cookies y almacenar datos de inicio de sesión
    //Funciones para utilizar las cookies en web
    retrieveSignedUser(){
      var headers: any;
      var token = this.getSessionToken();
      headers = new HttpHeaders({'Authorization': 'Bearer '+token});
      return this.http.get<any>(`${environment.url_api}/me/`,{headers:headers});
    }

  // Method to get user ID from cookie
  getUserIdCookie(): string | null {
    return this.cookieService.get(user_id_cookie_name);
  }

  // Method to get user's movement history (mock data)
  getUserMovementHistory(userId: string): Observable<VehicleMovementRecord[]> {
    console.log(`Fetching movement history for userId: ${userId}`); // Simulate API call
    const mockHistory: VehicleMovementRecord[] = [
      { id: 'hist1', placa: 'PBN1234', entry_time: new Date(Date.now() - 86400000 * 2), exit_time: new Date(Date.now() - 86400000 * 1.5), duration: '12h' },
      { id: 'hist2', placa: 'XYZ7890', entry_time: new Date(Date.now() - 86400000 * 5), exit_time: new Date(Date.now() - 86400000 * 4), duration: '24h' },
    ];
    return of(mockHistory); // Return Observable of mock data
  }

  // Method to get user's active vehicles on campus (mock data)
  getUserActiveVehicles(userId: string): Observable<ActiveVehicle[]> {
    console.log(`Fetching active vehicles for userId: ${userId}`); // Simulate API call
    const mockActiveVehicles: ActiveVehicle[] = [
      { id: 'active1', placa: 'ABC123Z', entry_time: new Date(Date.now() - 3600000 * 3) }, // Entered 3 hours ago
    ];
    return of(mockActiveVehicles); // Return Observable of mock data
  }

  // Service for user registration
  registerUser(userData: UserRegistrationData): Observable<any> {
    console.log('Registering user with data:', userData);
    // This is a mock API call. Replace with actual HTTP POST to your backend endpoint.
    // Example: return this.http.post<any>(`${environment.url_api}/api/register/`, userData, httpOptions);
    
    // Simulate a successful registration after a short delay
    return of({ success: true, message: 'User registered successfully' }).pipe(
      // delay(1500) // You might need to import delay from 'rxjs/operators'
    );
    // To simulate an error:
    // return throwError(() => new Error('Registration failed. Email already exists.'));
  }

  // Improved for asegurar que la matrícula esté presente y accesible
  getStudents(page: number, pageSize: number, sortOptions?: SortOptions): Observable<{ results: StudentData[], count: number }> {
    let params = new HttpParams()
      .set('page', (page + 1).toString())
      .set('size', pageSize.toString())
      .set('pageSize', pageSize.toString())
      .set('length', pageSize.toString());

    if (sortOptions?.active && sortOptions.direction) {
      params = params.set('ordering', `${sortOptions.direction === 'desc' ? '-' : ''}${sortOptions.active}`);
    }

    console.log('Enviando parámetros:', params.toString()); // Debug

    return this.http.get<any>(`${environment.url_api}/api/estudiantes/`, { params }).pipe(
      map(response => {
        if (response.results?.length !== pageSize) {
          console.log(`Respuesta del servidor:`, response); // Debug completo
        }
        return {
          results: response.results?.map((student: any) => ({
            ...student,
            matricula: student.matricula
          })) || [],
          count: response.count || 0
        };
      }),
      catchError(error => {
        console.error('Error detallado obteniendo estudiantes:', error);
        return throwError(() => new Error(`Error obteniendo estudiantes: ${error.message}`));
      })
    );
  }

  searchStudents(searchTerm: string, page: number, pageSize: number): Observable<{ results: StudentData[], count: number }> {
    let params = new HttpParams()
      .set('search', searchTerm)
      .set('page', (page + 1).toString())
      .set('page_size', pageSize.toString());

    return this.http.get<any>(`${environment.url_api}/api/estudiantes/buscar/`, { params })
      .pipe(
        map(response => ({
          results: response.results || [],
          count: response.count || 0
        })),
        catchError(error => {
          console.error('Error en búsqueda:', error);
          return throwError(() => new Error('Error al realizar la búsqueda'));
        })
      );
  }

  // Nueva función para obtener un estudiante por matrícula
  getStudentByMatricula(matricula: string): Observable<StudentData> {
    return this.http.get<StudentData>(`${environment.url_api}/api/estudiantes/${matricula}/`);
  }

    getCookieValue(key:string){
      return this.cookieService.get(key);
    }

    saveCookieValue(key:string, value:string){
      var secure = environment.url_api.indexOf("https")!=-1;
      this.cookieService.set(key, value, undefined, undefined, undefined, secure, secure?"None":"Lax");
    }

    getSessionToken(){
      return this.cookieService.get(session_cookie_name);
    }


saveUserData(user_data: any) {
  var secure = environment.url_api.indexOf("https") != -1;
  
  // Guardar datos del usuario directamente sin verificar rol
  this.cookieService.set(user_id_cookie_name, user_data.id, undefined, undefined, undefined, secure, secure?"None":"Lax");
  this.cookieService.set(user_email_cookie_name, user_data.email, undefined, undefined, undefined, secure, secure?"None":"Lax");
  this.cookieService.set(user_complete_name_cookie_name, user_data.first_name + " " + user_data.last_name, undefined, undefined, undefined, secure, secure?"None":"Lax");
  this.cookieService.set(session_cookie_name, user_data.token, undefined, undefined, undefined, secure, secure?"None":"Lax");
}

    destroyUser(){
      this.cookieService.deleteAll();
    }

    getUserEmail(){
      return this.cookieService.get(user_email_cookie_name);
    }

    getUserCompleteName(){
      return this.cookieService.get(user_complete_name_cookie_name);
    }

    getUserId(){
      return this.cookieService.get(user_id_cookie_name);
    }

    getUserGroup(){
      return this.cookieService.get(group_name_cookie_name);
    }

    // Añadir este nuevo método
    getActiveRecords(matricula: string): Observable<VehicleRecord[]> {
      return this.http.get<any>(
        `${environment.url_api}/api/vehiculos/activos/${matricula}/`
      ).pipe(
        map(response => {
          console.log('Respuesta activos:', response); // Debug
          const vehiculos = response?.vehiculos || [];
          return vehiculos.map((vehiculo: any) => ({
            id: vehiculo.id || vehiculo.placas, // Usar placas como ID alternativo
            placa: vehiculo.placas,
            entry_time: vehiculo.entrada || new Date().toISOString() // Si entrada está vacío, usar fecha actual
          }));
        }),
        catchError(error => {
          console.error('Error obteniendo registros activos:', error);
          return throwError(() => new Error('Error al obtener los vehículos activos'));
        })
      );
    }

    getHistoricalRecords(matricula: string): Observable<VehicleRecord[]> {
      return this.http.get<any>(
        `${environment.url_api}/api/vehiculos/historial/${matricula}/`
      ).pipe(
        map(response => {
          console.log('Respuesta historial:', response);
          const historial = response?.historial || [];
          return historial.map((vehiculo: any) => ({
            id: vehiculo.id,
            placa: vehiculo.placas,
            entry_time: vehiculo.entrada || new Date().toISOString(),
            exit_time: vehiculo.acciones === 'inactivo' ? new Date().toISOString() : undefined,
            duration: vehiculo.acciones === 'inactivo' ? 'Finalizado' : 'Activo'
          }));
        }),
        catchError(error => {
          console.error('Error obteniendo historial:', error);
          return throwError(() => new Error('Error al obtener el historial de vehículos'));
        })
      );
    }

registerVehicleEntry(matricula: string, placa: string): Observable<any> {
  const data = {
    matricula: matricula,
    placa: placa.toUpperCase()
  };

  return this.http.post<any>(
    `${environment.url_api}/api/vehiculos/entrada/`,
    data
  ).pipe(
    map(response => {
      console.log('Respuesta entrada:', response); // Debug
      return response;
    }),
    catchError(error => {
      console.error('Error registrando entrada:', error);
      return throwError(() => new Error(error.error?.message || 'Error al registrar la entrada del vehículo'));
    })
  );
}

    // Reemplazar la función registerVehicleExit existente con esta versión
    registerVehicleExit(recordId: string): Observable<any> {
      if (!recordId) {
        return throwError(() => new Error('ID de registro no válido'));
      }

      const data = {
        placa: recordId  // Cambiar a usar la placa en lugar del ID
      };

      console.log('Enviando salida para vehículo:', data); // Debug

      return this.http.post<any>(
        `${environment.url_api}/api/vehiculos/salida/`,
        data,
        httpOptions
      ).pipe(
        map(response => {
          console.log('Respuesta salida:', response);
          if (!response) {
            throw new Error('No se recibió respuesta del servidor');
          }
          return response;
        }),
        catchError(error => {
          console.error('Error detallado:', error);
          const errorMessage = error.error?.detail || 
                             error.error?.message || 
                             error.message || 
                             'Error al registrar la salida del vehículo';
          return throwError(() => new Error(errorMessage));
        })
      );
    }

}


export interface VehicleRecord {
  id?: string;
  placa: string;
  entry_time: string | Date;
  exit_time?: string | Date;
  duration?: string;
}
