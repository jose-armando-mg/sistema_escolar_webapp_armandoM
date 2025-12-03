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
export class EventosService {
  private apiUrl = environment.url_api; // Use URL from environment (dev/prod)

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private facadeService: FacadeService
  ) { }

  /**
   * Retorna el esquema base del evento académico
   */
  public esquemaEvento() {
    return {
      'nombre': '',
      'tipo': '',
      'fecha': '',
      'hora_inicio': '',
      'hora_fin': '',
      'lugar': '',
      'publico_objetivo': '',
      'programa_educativo': '',
      'responsable_id': '',
      'descripcion': '',
      'cupo_maximo': ''
    };
  }

  /**
   * Valida el formulario de evento académico
   */
  public validarEvento(data: any, editarMode: boolean = false): { [key: string]: string } {
    console.log("Validando evento... ", data);
    let error: any = {};

    // ========== VALIDACIÓN: NOMBRE ==========
    if (!this.validatorService.required(data["nombre"])) {
      error["nombre"] = this.errorService.required;
    } else if (!/^[a-zA-Z0-9\s]+$/.test(data["nombre"])) {
      error["nombre"] = "Solo se permiten letras, números y espacios";
    } else if (!this.validatorService.max(data["nombre"], 100)) {
      error["nombre"] = "El nombre no puede exceder 100 caracteres";
    }

    // ========== VALIDACIÓN: TIPO DE EVENTO ==========
    if (!this.validatorService.required(data["tipo"])) {
      error["tipo"] = this.errorService.required;
    }

    // ========== VALIDACIÓN: FECHA ==========
    if (!this.validatorService.required(data["fecha"])) {
      error["fecha"] = this.errorService.required;
    } else {
      // Solo validar que la fecha sea futura si estamos registrando (no editando)
      if (!editarMode) {
        const fechaSeleccionada = new Date(data["fecha"]);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaSeleccionada < hoy) {
          error["fecha"] = "No se pueden seleccionar fechas anteriores a hoy";
        }
      }
    }

    // ========== VALIDACIÓN: HORA DE INICIO ==========
    if (!this.validatorService.required(data["hora_inicio"])) {
      error["hora_inicio"] = this.errorService.required;
    }

    // ========== VALIDACIÓN: HORA DE FIN ==========
    if (!this.validatorService.required(data["hora_fin"])) {
      error["hora_fin"] = this.errorService.required;
    } else if (data["hora_inicio"] && data["hora_fin"] && data["hora_fin"] <= data["hora_inicio"]) {
      error["hora_fin"] = "La hora de fin debe ser mayor que la hora de inicio";
    }

    // ========== VALIDACIÓN: LUGAR ==========
    if (!this.validatorService.required(data["lugar"])) {
      error["lugar"] = this.errorService.required;
    } else if (!/^[a-zA-Z0-9\s]+$/.test(data["lugar"])) {
      error["lugar"] = "Solo se permiten caracteres alfanuméricos y espacios";
    } else if (!this.validatorService.max(data["lugar"], 100)) {
      error["lugar"] = "El lugar no puede exceder 100 caracteres";
    }

    // ========== VALIDACIÓN: PÚBLICO OBJETIVO ==========
    if (!this.validatorService.required(data["publico_objetivo"])) {
      error["publico_objetivo"] = this.errorService.required;
    }

    // ========== VALIDACIÓN: PROGRAMA EDUCATIVO ==========
    // Solo validar si "Estudiantes" está en el público objetivo
    if (data["publico_objetivo"] && data["publico_objetivo"].includes('Estudiantes')) {
      if (!this.validatorService.required(data["programa_educativo"])) {
        error["programa_educativo"] = "Debes seleccionar un programa educativo cuando el público objetivo incluye estudiantes";
      }
    }

    // ========== VALIDACIÓN: RESPONSABLE ==========
    if (!this.validatorService.required(data["responsable_id"])) {
      error["responsable_id"] = "Debes seleccionar un responsable";
    }

    // ========== VALIDACIÓN: DESCRIPCIÓN ==========
    if (!this.validatorService.required(data["descripcion"])) {
      error["descripcion"] = this.errorService.required;
    } else if (data["descripcion"].length > 300) {
      error["descripcion"] = "La descripción no puede exceder 300 caracteres";
    } else if (!/^[a-zA-Z0-9\s\.\,\!\?\-\(\)\:\;\'\"\áéíóúñÁÉÍÓÚÑ]+$/.test(data["descripcion"])) {
      error["descripcion"] = "Solo se permiten letras, números y signos de puntuación básicos (. , ! ? - ( ) : ; ' \")";
    }

    // ========== VALIDACIÓN: CUPO MÁXIMO ==========
    if (!this.validatorService.required(data["cupo_maximo"])) {
      error["cupo_maximo"] = this.errorService.required;
    } else if (!/^\d+$/.test(String(data["cupo_maximo"]))) {
      error["cupo_maximo"] = "El cupo debe ser un número entero positivo";
    } else {
      const cupo = parseInt(data["cupo_maximo"]);
      if (cupo < 1) {
        error["cupo_maximo"] = "El cupo debe ser mayor a 0";
      } else if (cupo > 999) {
        error["cupo_maximo"] = "El cupo no puede exceder 999 (máximo 3 dígitos)";
      }
    }

    return error;
  }

  /**
   * Obtiene la lista de responsables (maestros y administradores)
   */
  public obtenerResponsables(): Observable<any> {
    const token = this.facadeService.getSessionToken(); // OBTENIENDO el token, guardalo si existe
    let headers: HttpHeaders; // VARIABLE DONDE GUARDARAS LOS ENCABEZADOS DE LA PETICION
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }

    // Obtener maestros y administradores de sus respectivos endpoints
    const maestros$ = this.http.get<any>(`${this.apiUrl}/lista-maestros/`, { headers });
    const admins$ = this.http.get<any>(`${this.apiUrl}/lista-admins/`, { headers });

    // Retornar un observable que combine ambas peticiones
    return new Observable((observer) => {
      let maestrosData: any[] = [];
      let adminsData: any[] = [];
      let completedRequests = 0;

      // Hacer petición de maestros
      maestros$.subscribe(
        (data) => {
          maestrosData = data || [];
          completedRequests++;
          if (completedRequests === 2) {
            this.combinarResponsables(maestrosData, adminsData, observer);
          }
        },
        (error) => {
          console.error('Error al obtener maestros:', error);
          observer.error(error);
        }
      );

      // Hacer petición de administradores
      admins$.subscribe(
        (data) => {
          adminsData = data || [];
          completedRequests++;
          if (completedRequests === 2) {
            this.combinarResponsables(maestrosData, adminsData, observer);
          }
        },
        (error) => {
          console.error('Error al obtener administradores:', error);
          observer.error(error);
        }
      );
    });
    // OBTIENE LOS DATOS DEL SERVIDOR, LE PASAS LA URL DEL ENDPOINT, LOS HEADERS Y REGRESAS UN OBSERVABLE
    // LA PETICION SE EJECUTA EN EL COMPONENTE CON EL SUBSCRIBE
  }

  /**
   * Combina maestros y administradores en una sola lista de responsables
   */
  private combinarResponsables(maestros: any[], admins: any[], observer: any): void {
    try {
      // Normalizar maestros - acceder al objeto user anidado
      const responsablesMaestros = maestros.map((m: any) => {
        // Extraer el nombre del objeto user anidado
        let nombre = 'Sin nombre';
        if (m.user) {
          const firstName = m.user.first_name || '';
          const lastName = m.user.last_name || '';
          if (firstName && lastName) {
            nombre = `${firstName} ${lastName}`;
          } else if (firstName) {
            nombre = firstName;
          } else if (lastName) {
            nombre = lastName;
          }
        }

        // Use the underlying user id when available (backend expects User id)
        const idUsuario = (m.user && m.user.id) ? m.user.id : m.id;
        return {
          id: idUsuario,
          nombre: nombre
        };
      });

      // Normalizar administradores - acceder al objeto user anidado
      const responsablesAdmins = admins.map((a: any) => {
        // Extraer el nombre del objeto user anidado
        let nombre = 'Sin nombre';
        if (a.user) {
          const firstName = a.user.first_name || '';
          const lastName = a.user.last_name || '';
          if (firstName && lastName) {
            nombre = `${firstName} ${lastName}`;
          } else if (firstName) {
            nombre = firstName;
          } else if (lastName) {
            nombre = lastName;
          }
        }

        // Use the underlying user id when available
        const idUsuario = (a.user && a.user.id) ? a.user.id : a.id;
        return {
          id: idUsuario,
          nombre: nombre
        };
      });

      // Combinar ambas listas
      const responsablesCompletos = [...responsablesMaestros, ...responsablesAdmins];

      console.log('Responsables combinados:', responsablesCompletos); // Para debugging

      observer.next(responsablesCompletos);
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  }  /**
   * Obtiene la lista de todos los eventos académicos
   */
  public obtenerEventos(): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.get<any>(`${this.apiUrl}/lista-eventos/`, { headers });
  }

  /**
   * Obtiene un evento específico por ID
   */
  public obtenerEventoPorID(idEvento: number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    // Backend exposes 'eventos/' and accepts an 'id' query param to get a single event
    return this.http.get<any>(`${this.apiUrl}/eventos/?id=${idEvento}`, { headers });
  }

  /**
   * Registra un nuevo evento académico
   */
  public registrarEvento(data: any): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    // Convertir la fecha al formato YYYY-MM-DD
    const datosFormato = { ...data };
    if (datosFormato.fecha) {
      const fecha = new Date(datosFormato.fecha);
      datosFormato.fecha = fecha.toISOString().split('T')[0]; // Convierte a YYYY-MM-DD
    }

    // Convertir horas al formato HH:MM (24 horas)
    if (datosFormato.hora_inicio) {
      datosFormato.hora_inicio = this.convertirHoraA24(datosFormato.hora_inicio);
    }
    if (datosFormato.hora_fin) {
      datosFormato.hora_fin = this.convertirHoraA24(datosFormato.hora_fin);
    }

    // Convertir responsable_id a número
    if (datosFormato.responsable_id) {
      datosFormato.responsable_id = parseInt(datosFormato.responsable_id, 10);
    }

    console.log('URL:', `${this.apiUrl}/eventos/`);
    console.log('Datos enviados:', datosFormato);
    console.log('responsable_id enviado:', datosFormato.responsable_id, 'Tipo:', typeof datosFormato.responsable_id);
    console.log('Headers:', headers);

    return this.http.post<any>(`${this.apiUrl}/eventos/`, datosFormato, { headers });
  }

  /**
   * Convierte hora de formato 12h (5:00 PM) a formato 24h (17:00)
   */
  private convertirHoraA24(horaFormato12: string): string {
    if (!horaFormato12) return '';

    // Si ya está en formato 24h (contiene solo números y :), devolvelo así
    if (!/[APap][Mm]/.test(horaFormato12)) {
      return horaFormato12;
    }

    const partes = horaFormato12.match(/(\d+):(\d+)\s*([APap][Mm])/);
    if (!partes) return horaFormato12;

    let horas = parseInt(partes[1]);
    const minutos = partes[2];
    const periodo = partes[3].toUpperCase();

    if (periodo === 'PM' && horas !== 12) {
      horas += 12;
    } else if (periodo === 'AM' && horas === 12) {
      horas = 0;
    }

    return `${String(horas).padStart(2, '0')}:${minutos}`;
  }

  /**
   * Actualiza un evento académico existente
   */
  public actualizarEvento(idEvento: number, data: any): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    // Convertir la fecha al formato YYYY-MM-DD
    const datosFormato = { ...data };
    if (datosFormato.fecha) {
      const fecha = new Date(datosFormato.fecha);
      datosFormato.fecha = fecha.toISOString().split('T')[0]; // Convierte a YYYY-MM-DD
    }

    // Convertir horas al formato HH:MM (24 horas)
    if (datosFormato.hora_inicio) {
      datosFormato.hora_inicio = this.convertirHoraA24(datosFormato.hora_inicio);
    }
    if (datosFormato.hora_fin) {
      datosFormato.hora_fin = this.convertirHoraA24(datosFormato.hora_fin);
    }

    // Convertir responsable_id a número
    if (datosFormato.responsable_id) {
      datosFormato.responsable_id = parseInt(datosFormato.responsable_id, 10);
    }

    // Incluir el ID en los datos (backend espera id en el body in some implementations)
    const datosActualizar = { ...datosFormato, id: idEvento };

    // Some backends expect the id as query param while the URL path is the collection.
    // Try PUT to /eventos/?id=<id> which matches the Django URLconf for 'eventos/'.
    const urlWithQuery = `${this.apiUrl}/eventos/?id=${idEvento}`;

    console.log('URL (PUT):', urlWithQuery);
    console.log('Datos enviados:', datosActualizar);
    console.log('Headers:', headers);

    return this.http.put<any>(urlWithQuery, datosActualizar, { headers });
  }

  /**
   * Elimina un evento académico
   */
  public eliminarEvento(idEvento: number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.delete<any>(`${this.apiUrl}/eventos/?id=${idEvento}`, { headers });
  }

  public getTotalEventos(): Observable<any>{
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.get<any>(`${this.apiUrl}/total-eventos/`, { headers });
  }
}
