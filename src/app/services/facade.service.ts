import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
// Make sure the path is correct; update if necessary
import { ValidatorServiceService } from './tools/validator-service.service';
import { ErrorServiceService } from './tools/error-service.service';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

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
}
