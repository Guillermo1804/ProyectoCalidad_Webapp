import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ValidatorServiceService } from './tools/validator-service.service';
import { ErrorServiceService } from './tools/error-service.service';
import { FacadeServiceService } from './facade.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorServiceService,
    private errorService: ErrorServiceService,
    private facadeServiceService: FacadeServiceService,
  ) { }


  public esquemaAlumno(){
    return {
      'matricula': '',
      'apellido_paterno': '',
      'apellido_materno': '',
      'nombre': '',
      'email': '',
    }
  }


  //Validación para el formulario
  public validarAlumno(data: any, editar: boolean){
    console.log("Validando alumno... ", data);
    let error: any = [];

    if(!this.validatorService.required(data["matricula"])){
      error["matricula"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["first_name"])){
      error["first_name"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["last_name"])){
      error["last_name"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["email"])){
      error["email"] = this.errorService.required;
    }else if(!this.validatorService.max(data["email"], 40)){
      error["email"] = this.errorService.max(40);
    }else if (!this.validatorService.email(data['email'])) {
      error['email'] = this.errorService.email;
    }

    if(!editar){
      if(!this.validatorService.required(data["password"])){
        error["password"] = this.errorService.required;
      }

      if(!this.validatorService.required(data["confirmar_password"])){
        error["confirmar_password"] = this.errorService.required;
      }
    }
    if(!this.validatorService.required(data["fecha_nacimiento"])){
      error["fecha_nacimiento"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["curp"])){
      error["curp"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["rfc"])){
      error["rfc"] = this.errorService.required;
    }else if(!this.validatorService.min(data["rfc"], 12)){
      error["rfc"] = this.errorService.min(12);
      alert("La longitud de caracteres deL RFC es menor, deben ser 12");
    }else if(!this.validatorService.max(data["rfc"], 13)){
      error["rfc"] = this.errorService.max(13);
      alert("La longitud de caracteres deL RFC es mayor, deben ser 13");
    }

    if(!this.validatorService.required(data["edad"])){
      error["edad"] = this.errorService.required;
    }else if(!this.validatorService.numeric(data["edad"])){
      alert("El formato es solo números");
    }

    if(!this.validatorService.required(data["telefono"])){
      error["telefono"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["ocupacion"])){
      error["ocupacion"] = this.errorService.required;
    }

    //Return arreglo
    return error;
  }

  //Aquí van los servicios HTTP
  //Servicio para registrar un nuevo usuario
  public registrarAlumno (data: any): Observable <any>{
    return this.http.post<any>(`${environment.url_api}/alumnos/`,data, httpOptions);
  }

    //Servicio para actualizar un usuario
  public editarAlumno (data: any): Observable <any>{
    var token = this.facadeServiceService.getSessionToken();
    var headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
    return this.http.put<any>(`${environment.url_api}/alumnos-edit/`, data, {headers:headers});
  }

    //Eliminar Alumno
    public eliminarAlumno(idUser: number): Observable <any>{
      var token = this.facadeServiceService.getSessionToken();
      var headers = new HttpHeaders({ 'Content-Type': 'application/json' , 'Authorization': 'Bearer '+token});
      return this.http.delete<any>(`${environment.url_api}/alumnos-edit/?id=${idUser}`,{headers:headers});
  }
}
