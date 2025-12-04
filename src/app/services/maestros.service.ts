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
export class MaestrosService {

    private apiUrl = environment.url_api;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private facadeService: FacadeService
  ) { }

  public esquemaMaestro() {
    return {
      'rol': '',
      'clave_maestro': '',
      'first_name': '',
      'last_name': '',
      'email': '',
      'password': '',
      'confirmar_password': '',
      'telefono': '',
      'rfc': '',
      'cubiculo': '',
      'area_investigacion': '',
      'materias': []
    }
  }

  public validarMaestro(data: any, editar: boolean) {
  let error: any = {};

  // ========== MATRÍCULA ==========
  if(!this.validatorService.required(data["matricula"])){
    error["matricula"] = this.errorService.required;
  } else if(!/^[A-Za-z0-9]+$/.test(data["matricula"])){
    error["matricula"] = "La matrícula solo puede contener letras y números";
  } else if(data["matricula"].length < 5){
    error["matricula"] = "La matrícula debe tener al menos 5 caracteres";
  } else if(data["matricula"].length > 15){
    error["matricula"] = "La matrícula no puede tener más de 15 caracteres";
  }

  // ========== NOMBRE ==========
  if(!this.validatorService.required(data["first_name"])){
    error["first_name"] = this.errorService.required;
  } else if(!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(data["first_name"])){
    error["first_name"] = "El nombre solo puede contener letras y espacios";
  } else if(data["first_name"].trim().length < 2){
    error["first_name"] = "El nombre debe tener al menos 2 caracteres";
  } else if(data["first_name"].length > 50){
    error["first_name"] = "El nombre no puede tener más de 50 caracteres";
  }

  // ========== APELLIDOS ==========
  if(!this.validatorService.required(data["last_name"])){
    error["last_name"] = this.errorService.required;
  } else if(!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(data["last_name"])){
    error["last_name"] = "Los apellidos solo pueden contener letras y espacios";
  } else if(data["last_name"].trim().length < 2){
    error["last_name"] = "Los apellidos deben tener al menos 2 caracteres";
  } else if(data["last_name"].length > 50){
    error["last_name"] = "Los apellidos no pueden tener más de 50 caracteres";
  }

  // ========== EMAIL ==========
  if(!this.validatorService.required(data["email"])){
    error["email"] = this.errorService.required;
  } else if(!this.validatorService.email(data['email'])){
    error['email'] = this.errorService.email;
  } else if(!this.validatorService.max(data["email"], 40)){
    error["email"] = this.errorService.max(40);
  }

  // ========== CONTRASEÑA (solo si no es edición) ==========
  if(!editar){
    if(!this.validatorService.required(data["password"])){
      error["password"] = this.errorService.required;
    } else if(data["password"].length < 8){
      error["password"] = "La contraseña debe tener al menos 8 caracteres";
    } else if(!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(data["password"])){
      error["password"] = "La contraseña debe contener mayúsculas, minúsculas y números";
    }

    if(!this.validatorService.required(data["confirmar_password"])){
      error["confirmar_password"] = this.errorService.required;
    } else if(data["password"] !== data["confirmar_password"]){
      error["confirmar_password"] = "Las contraseñas no coinciden";
    }
  }

  // ========== FECHA DE NACIMIENTO ==========
  if(!this.validatorService.required(data["fecha_nacimiento"])){
    error["fecha_nacimiento"] = this.errorService.required;
  } else {
    const fechaNacimiento = new Date(data["fecha_nacimiento"]);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    if(edad < 22){
      error["fecha_nacimiento"] = "El maestro debe tener al menos 22 años de edad";
    }
  }

  // ========== TELÉFONO ==========
  if(!this.validatorService.required(data["telefono"])){
    error["telefono"] = this.errorService.required;
  } else {
    // Remover formato para validar solo números
    const telefonoLimpio = data["telefono"].replace(/\D/g, '');
    if(telefonoLimpio.length !== 10){
      error["telefono"] = "El teléfono debe tener 10 dígitos";
    }
  }

  // ========== RFC ==========
  if(!this.validatorService.required(data["rfc"])){
    error["rfc"] = this.errorService.required;
  } else {
    const rfcLimpio = data["rfc"].toUpperCase().trim();

    if(rfcLimpio.length < 12){
      error["rfc"] = "El RFC debe tener al menos 12 caracteres";
    } else if(rfcLimpio.length > 13){
      error["rfc"] = "El RFC no puede tener más de 13 caracteres";
    } else if(!/^[A-ZÑ]{3,4}\d{6}[A-Z0-9]{2,3}$/.test(rfcLimpio)){
      // No permitimos caracteres especiales como '&' en el RFC; solo letras (incluye Ñ) y números
      error["rfc"] = "El formato del RFC no es válido (Ej: ABCD123456XYZ)";
    }
  }

  // ========== CUBÍCULO ==========
  if(!this.validatorService.required(data["cubiculo"])){
    error["cubiculo"] = this.errorService.required;
  } else {
    const cubiculo = String(data["cubiculo"]).trim();
    if(cubiculo.length < 1){
      error["cubiculo"] = "El cubículo no puede estar vacío";
    } else if(!/^[A-Za-z0-9]+$/.test(cubiculo)){
      error["cubiculo"] = "El cubículo solo puede contener letras y números";
    } else if(cubiculo.length > 20){
      error["cubiculo"] = "El cubículo no puede exceder 20 caracteres";
    }
  }

  // ========== ÁREA DE INVESTIGACIÓN ==========
  if(!this.validatorService.required(data["area_investigacion"])){
    error["area_investigacion"] = this.errorService.required;
  }

  // ========== MATERIAS ==========
  if(!data["materias_json"] || !Array.isArray(data["materias_json"]) || data["materias_json"].length === 0){
    error["materias"] = "Debes seleccionar al menos una materia";
  }

  return error;
}
  //Aquí van los servicios HTTP
  //Servicio para registrar un nuevo usuario
  public registrarMaestro (data: any): Observable <any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.post<any>(`${environment.url_api}/maestros/`, data, { headers });
  }
//Servicio para obtener la lista de maestros
  public obtenerListaMaestros(): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.get<any>(`${environment.url_api}/lista-maestros/`, { headers });
  }


public obtenerMaestroPorID(idMaestro: number): Observable<any>{
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.get<any>(`${environment.url_api}/maestros/?id=${idMaestro}`, { headers });
  }

  public actualizarMaestro(data: any): Observable<any> {
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.put<any>(`${environment.url_api}/maestros/`, data, { headers });
  }

//Servicio para eliminar un maestro
  public eliminarMaestro(idMaestro: number): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.delete<any>(`${environment.url_api}/maestros/?id=${idMaestro}`, { headers });
  }
}





