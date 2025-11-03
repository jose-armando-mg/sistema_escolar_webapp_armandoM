import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidatorService } from './tools/validator.service';
import { ErrorsService } from './tools/errors.service';
import { FacadeService } from './facade.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AdministradoresService {
    private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private facadeService: FacadeService
  ) { }

  public esquemaAdmin(){
    return {
      'rol':'',
      'clave_admin': '',
      'first_name': '',
      'last_name': '',
      'email': '',
      'password': '',
      'confirmar_password': '',
      'telefono': '',
      'rfc': '',
      'edad': '',
      'ocupacion': ''
    }
  }

  //Validación para el formulario
  public validarAdmin(data: any, editar: boolean){
  console.log("Validando admin... ", data);
  let error: any = {};

  // ========== VALIDACIÓN: CLAVE DE ADMINISTRADOR ==========
  if(!this.validatorService.required(data["clave_admin"])){
    error["clave_admin"] = this.errorService.required;
  } else if(!this.validatorService.min(data["clave_admin"], 5)){
    error["clave_admin"] = "La clave debe tener al menos 5 caracteres";
  } else if(!this.validatorService.max(data["clave_admin"], 20)){
    error["clave_admin"] = "La clave no puede tener más de 20 caracteres";
  } else if(!/^[a-zA-Z0-9]+$/.test(data["clave_admin"])){
    error["clave_admin"] = "La clave solo puede contener letras y números";
  }

  // ========== VALIDACIÓN: NOMBRE ==========
  if(!this.validatorService.required(data["first_name"])){
    error["first_name"] = this.errorService.required;
  } else if(!this.validatorService.min(data["first_name"], 2)){
    error["first_name"] = "El nombre debe tener al menos 2 caracteres";
  } else if(!this.validatorService.max(data["first_name"], 50)){
    error["first_name"] = "El nombre no puede tener más de 50 caracteres";
  } else if(!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data["first_name"])){
    error["first_name"] = "El nombre solo puede contener letras";
  }

  // ========== VALIDACIÓN: APELLIDOS ==========
  if(!this.validatorService.required(data["last_name"])){
    error["last_name"] = this.errorService.required;
  } else if(!this.validatorService.min(data["last_name"], 2)){
    error["last_name"] = "Los apellidos deben tener al menos 2 caracteres";
  } else if(!this.validatorService.max(data["last_name"], 50)){
    error["last_name"] = "Los apellidos no pueden tener más de 50 caracteres";
  } else if(!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data["last_name"])){
    error["last_name"] = "Los apellidos solo pueden contener letras";
  }

  // ========== VALIDACIÓN: EMAIL ==========
  if(!this.validatorService.required(data["email"])){
    error["email"] = this.errorService.required;
  } else if(!this.validatorService.email(data["email"])){
    error["email"] = "Ingresa un correo electrónico válido";
  } else if(!this.validatorService.max(data["email"], 100)){
    error["email"] = "El correo no puede tener más de 100 caracteres";
  }

  // ========== VALIDACIÓN: CONTRASEÑAS (solo si no está editando) ==========
  if(!editar){
    // Validar contraseña
    if(!this.validatorService.required(data["password"])){
      error["password"] = this.errorService.required;
    } else if(!this.validatorService.min(data["password"], 8)){
      error["password"] = "La contraseña debe tener al menos 8 caracteres";
    } else if(!/(?=.*[a-z])/.test(data["password"])){
      error["password"] = "La contraseña debe contener al menos una letra minúscula";
    } else if(!/(?=.*[A-Z])/.test(data["password"])){
      error["password"] = "La contraseña debe contener al menos una letra mayúscula";
    } else if(!/(?=.*\d)/.test(data["password"])){
      error["password"] = "La contraseña debe contener al menos un número";
    } else if(!/(?=.*[@$!%*?&#])/.test(data["password"])){
      error["password"] = "La contraseña debe contener al menos un carácter especial (@$!%*?&#)";
    }

    // Validar confirmar contraseña
    if(!this.validatorService.required(data["confirmar_password"])){
      error["confirmar_password"] = this.errorService.required;
    } else if(data["password"] !== data["confirmar_password"]){
      error["confirmar_password"] = "Las contraseñas no coinciden";
    }
  }

  // ========== VALIDACIÓN: TELÉFONO ==========
  if(!this.validatorService.required(data["telefono"])){
    error["telefono"] = this.errorService.required;
  } else if(!/^\d+$/.test(data["telefono"])){
    error["telefono"] = "El teléfono solo puede contener números";
  } else if(data["telefono"].length !== 10){
    error["telefono"] = "El teléfono debe tener exactamente 10 dígitos";
  }

  // ========== VALIDACIÓN: RFC ==========
  if(!this.validatorService.required(data["rfc"])){
    error["rfc"] = this.errorService.required;
  } else {
    const rfcLength = data["rfc"].length;
    if(rfcLength < 12 || rfcLength > 13){
      error["rfc"] = "El RFC debe tener 12 o 13 caracteres";
    } else if(!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(data["rfc"].toUpperCase())){
      error["rfc"] = "El formato del RFC no es válido";
    }
  }

  // ========== VALIDACIÓN: EDAD ==========
  if(!this.validatorService.required(data["edad"])){
    error["edad"] = this.errorService.required;
  } else if(!this.validatorService.numeric(data["edad"])){
    error["edad"] = "La edad debe ser un número";
  } else {
    const edad = parseInt(data["edad"]);
    if(edad < 18){
      error["edad"] = "La edad debe ser mayor o igual a 18 años";
    } else if(edad > 100){
      error["edad"] = "La edad no puede ser mayor a 100 años";
    }
  }

  // ========== VALIDACIÓN: OCUPACIÓN ==========
  if(!this.validatorService.required(data["ocupacion"])){
    error["ocupacion"] = this.errorService.required;
  } else if(!this.validatorService.min(data["ocupacion"], 3)){
    error["ocupacion"] = "La ocupación debe tener al menos 3 caracteres";
  } else if(!this.validatorService.max(data["ocupacion"], 100)){
    error["ocupacion"] = "La ocupación no puede tener más de 100 caracteres";
  }

  return error;
}
  //Registrar admin

//Aquí van los servicios HTTP
  //Servicio para registrar un nuevo usuario
  public registrarAdmin (data: any): Observable <any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.post<any>(`${environment.url_api}/admin/`,data, { headers });
  }
}
