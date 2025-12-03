import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EventosService } from 'src/app/services/eventos.service';

interface EventoAcademicoForm {
  nombre: string;
  tipo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  publico_objetivo: string;
  programa_educativo?: string;
  responsable_id: string;
  descripcion: string;
  cupo_maximo: string;
}

@Component({
  selector: 'app-eventos-academicos',
  templateUrl: './eventos-academicos.component.html',
  styleUrls: ['./eventos-academicos.component.scss']
})
export class EventosAcademicosComponent implements OnInit {
  registrarMode = false;
  editarMode = false;
  cargando = false;
  minFecha: Date;
  eventoId: number | null = null;

  evento: EventoAcademicoForm = {
    nombre: '',
    tipo: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    publico_objetivo: '',
    programa_educativo: '',
    responsable_id: '',
    descripcion: '',
    cupo_maximo: ''
  };

  errors: any = {};

  // Opciones para los selects
  tiposEvento: string[] = ['Conferencia', 'Taller', 'Seminario', 'Concurso'];
  publicos: string[] = ['Estudiantes', 'Profesores', 'Público general'];
  programasEducativos: string[] = [
    'Ingeniería en Ciencias de la Computación',
    'Licenciatura en Ciencias de la Computación',
    'Ingeniería en Tecnologías de la Información'
  ];
  responsables: any[] = [];

  // Control para los checkboxes de público objetivo
  eventoPublicos: any = {
    'Estudiantes': false,
    'Profesores': false,
    'Público general': false
  };

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private eventosService: EventosService
  ) {}

  ngOnInit(): void {
    // Establecer la fecha mínima a hoy
    this.minFecha = new Date();
    this.minFecha.setHours(0, 0, 0, 0);

    // Detectar el modo usando los parámetros de ruta
    this.route.params.subscribe(params => {
      if (params['id']) {
        // Si hay un ID en los parámetros, estamos en modo edición
        this.editarMode = true;
        this.registrarMode = false;
        this.eventoId = +params['id']; // Convertir a número
        this.cargarEvento(this.eventoId);
      } else {
        // Si no hay ID, verificamos si estamos en modo registro
        this.route.url.subscribe(url => {
          if (url.length > 0 && url[url.length - 1].path === 'registrar') {
            this.registrarMode = true;
            this.editarMode = false;
            this.cargarResponsables();
          }
        });
      }
    });
  }

  /**
   * Carga un evento específico para editar
   */
  cargarEvento(id: number): void {
    this.cargando = true;
    // Primero cargar responsables
    this.eventosService.obtenerResponsables().subscribe(
      (responsables: any) => {
        this.responsables = responsables;
        console.log('Responsables cargados:', this.responsables);

        // Luego obtener todos los eventos y buscar el que coincida con el ID
        this.eventosService.obtenerEventos().subscribe(
          (eventos: any[]) => {
            const eventoEncontrado = eventos.find(e => e.id === id);
            if (eventoEncontrado) {
              // Llenar el formulario con los datos del evento
              this.evento.nombre = eventoEncontrado.nombre;
              this.evento.tipo = eventoEncontrado.tipo;
              this.evento.fecha = eventoEncontrado.fecha;
              // Convertir horas del formato HH:MM:SS a HH:MM
              this.evento.hora_inicio = eventoEncontrado.hora_inicio?.substring(0, 5) || '';
              this.evento.hora_fin = eventoEncontrado.hora_fin?.substring(0, 5) || '';
              this.evento.lugar = eventoEncontrado.lugar;
              this.evento.publico_objetivo = eventoEncontrado.publico_objetivo;
              this.evento.programa_educativo = eventoEncontrado.programa_educativo;
              this.evento.descripcion = eventoEncontrado.descripcion;
              this.evento.cupo_maximo = eventoEncontrado.cupo_maximo.toString();

              // Determinar el responsable
              let responsableId: any = null;

              console.log('Evento encontrado:', eventoEncontrado);
              console.log('Responsable en evento:', eventoEncontrado.responsable);
              console.log('Responsable ID en evento:', eventoEncontrado.responsable_id);

              if (eventoEncontrado.responsable_id) {
                responsableId = eventoEncontrado.responsable_id;
              } else if (eventoEncontrado.responsable) {
                if (eventoEncontrado.responsable.id) {
                  responsableId = eventoEncontrado.responsable.id;
                } else if (eventoEncontrado.responsable.user) {
                  responsableId = eventoEncontrado.responsable.user.id;
                }
              }

              if (responsableId) {
                this.evento.responsable_id = responsableId.toString();
              }

              console.log('Responsable ID asignado:', this.evento.responsable_id);
              console.log('Tipos - responsableId:', typeof responsableId, 'responsables[0].id:', typeof this.responsables[0]?.id);

              // Buscar coincidencia de responsable
              let responsableEncontrado = this.responsables.find((r: any) => {
                const rIdStr = r.id.toString();
                const eventoIdStr = this.evento.responsable_id.toString();
                console.log(`Comparando: ${rIdStr} === ${eventoIdStr} = ${rIdStr === eventoIdStr}`);
                return rIdStr === eventoIdStr;
              });
              console.log('Responsable encontrado:', responsableEncontrado);

              // Si no encuentra por ID, intentar buscar por nombre
              if (!responsableEncontrado && eventoEncontrado.responsable) {
                const nombreResponsable = eventoEncontrado.responsable.user
                  ? `${eventoEncontrado.responsable.user.first_name} ${eventoEncontrado.responsable.user.last_name}`
                  : `${eventoEncontrado.responsable.first_name} ${eventoEncontrado.responsable.last_name}`;

                responsableEncontrado = this.responsables.find((r: any) => r.nombre === nombreResponsable);

                if (responsableEncontrado) {
                  console.log('Responsable encontrado por nombre:', responsableEncontrado);
                  this.evento.responsable_id = responsableEncontrado.id.toString();
                }
              }              // Marcar los públicos objetivo en los checkboxes
              if (this.evento.publico_objetivo) {
                const publicosArray = this.evento.publico_objetivo.split(',').map(p => p.trim());
                publicosArray.forEach(p => {
                  if (this.eventoPublicos.hasOwnProperty(p)) {
                    this.eventoPublicos[p] = true;
                  }
                });
              }

              this.cargando = false;
            } else {
              this.cargando = false;
              alert('Evento no encontrado');
              this.router.navigate(['/eventos-academicos']);
            }
          },
          (error) => {
            this.cargando = false;
            console.error('Error al cargar evento:', error);
            alert('Error al cargar el evento');
            this.router.navigate(['/eventos-academicos']);
          }
        );
      },
      (error) => {
        this.cargando = false;
        console.error('Error al cargar responsables:', error);
      }
    );
  }  /**
   * Carga la lista de responsables (maestros y administradores)
   */
  cargarResponsables(): void {
    this.cargando = true;
    this.eventosService.obtenerResponsables().subscribe(
      (responsables: any) => {
        console.log('Responsables cargados:', responsables);
        this.responsables = responsables;
        this.cargando = false;
      },
      (error) => {
        console.error('Error al cargar responsables:', error);
        this.errors['responsable_id'] = 'Error al cargar la lista de responsables';
        this.cargando = false;
      }
    );
  }

  /**
   * Determina si mostrar el campo de programa educativo
   */
  mostrarPrograma(): boolean {
    return !!(this.evento.publico_objetivo && this.evento.publico_objetivo.includes('Estudiantes'));
  }

  /**
   * Actualiza el público objetivo basado en los checkboxes
   */
  actualizarPublicoObjetivo(publico: string): void {
    // Obtener los públicos seleccionados
    const publicosSeleccionados = Object.keys(this.eventoPublicos)
      .filter(p => this.eventoPublicos[p]);

    // Si hay seleccionados, unirlos en una cadena separada por comas
    if (publicosSeleccionados.length > 0) {
      this.evento.publico_objetivo = publicosSeleccionados.join(', ');
    } else {
      this.evento.publico_objetivo = '';
    }

    this.limpiarError('publico_objetivo');
  }

  /**
   * Valida el nombre en tiempo real (solo letras, números y espacios)
   */
  validarNombreEnTiempoReal(event: any): void {
    const input = event.target;
    // Reemplazar caracteres especiales con texto vacío
    input.value = input.value.replace(/[^a-zA-Z0-9\s]/g, '');
    this.evento.nombre = input.value;
    this.limpiarError('nombre');
  }

  /**
   * Valida el lugar en tiempo real (solo alfanuméricos y espacios)
   */
  validarLugarEnTiempoReal(event: any): void {
    const input = event.target;
    // Reemplazar caracteres especiales con texto vacío
    input.value = input.value.replace(/[^a-zA-Z0-9\s]/g, '');
    this.evento.lugar = input.value;
    this.limpiarError('lugar');
  }

  /**
   * Valida el cupo máximo en tiempo real (solo números, máximo 3 dígitos)
   */
  validarCupoEnTiempoReal(event: any): void {
    const input = event.target;
    // Solo permitir números
    input.value = input.value.replace(/[^0-9]/g, '');
    // Limitar a 3 dígitos (999)
    if (input.value.length > 3) {
      input.value = input.value.substring(0, 3);
    }
    this.evento.cupo_maximo = input.value;
    this.limpiarError('cupo_maximo');
  }

  /**
   * Valida la descripción en tiempo real (máximo 300 caracteres)
   */
  validarDescripcionEnTiempoReal(event: any): void {
    const input = event.target;
    // Limitar a 300 caracteres
    if (input.value.length > 300) {
      input.value = input.value.substring(0, 300);
    }
    this.evento.descripcion = input.value;
    this.limpiarError('descripcion');
  }

  /**
   * Limpia los errores cuando el usuario escribe en un campo
   */
  limpiarError(campo: string): void {
    if (this.errors[campo]) {
      delete this.errors[campo];
    }
    // Forzar detección de cambios
    this.errors = { ...this.errors };
  }

  /**
   * Valida el formulario completo usando el servicio
   */
  validar(): boolean {
    // Llamar al servicio de validación, pasando el modo de edición
    this.errors = this.eventosService.validarEvento(this.evento, this.editarMode);

    // Retornar true si no hay errores
    return Object.keys(this.errors).length === 0;
  }

  /**
   * Convierte horas de formato 12 horas (ej: "1:00 PM") a formato 24 horas (ej: "13:00")
   */
  convertirHoraA24Horas(hora: string): string {
    if (!hora) return '';

    // Si ya está en formato 24 horas (HH:MM), retornarlo tal cual
    if (hora.match(/^\d{2}:\d{2}$/)) {
      return hora;
    }

    // Parsear formato 12 horas (ej: "1:00 PM")
    const partes = hora.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!partes) return hora;

    let horas = parseInt(partes[1], 10);
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
   * Envía el formulario (registra o actualiza)
   */
  submit(): void {
    console.log('Enviando evento:', this.evento);

    // Validar antes de enviar
    if (!this.validar()) {
      console.log('Errores de validación:', this.errors);
      return;
    }

    // Verificar que el responsable seleccionado exista en la lista de responsables
    const responsableIdNum = parseInt(this.evento.responsable_id as any, 10);
    if (this.evento.responsable_id && !this.responsables.find(r => r.id === responsableIdNum)) {
      this.errors['responsable_id'] = 'El responsable seleccionado no es válido';
      console.error('Responsable inválido antes de enviar:', this.evento.responsable_id);
      this.cargando = false;
      return;
    }

    this.cargando = true;

    // Preparar datos para enviar
    const eventoParaEnviar = { ...this.evento };
    eventoParaEnviar.hora_inicio = this.convertirHoraA24Horas(eventoParaEnviar.hora_inicio);
    eventoParaEnviar.hora_fin = this.convertirHoraA24Horas(eventoParaEnviar.hora_fin);

    console.log('Responsable ID antes de enviar:', eventoParaEnviar.responsable_id, 'Tipo:', typeof eventoParaEnviar.responsable_id);
    console.log('Evento para enviar:', eventoParaEnviar);

    if (this.editarMode && this.eventoId) {
      // Actualizar evento existente
      this.eventosService.actualizarEvento(this.eventoId, eventoParaEnviar).subscribe(
        (response: any) => {
          console.log('Evento actualizado correctamente:', response);
          alert('Evento actualizado correctamente');
          this.router.navigate(['/eventos-academicos']);
          this.cargando = false;
        },
        (error) => {
          console.error('Error al actualizar evento:', error);
          alert('Error al actualizar el evento: ' + (error.error?.message || 'Error desconocido'));
          this.cargando = false;
        }
      );
    } else {
      // Registrar nuevo evento
      this.eventosService.registrarEvento(eventoParaEnviar).subscribe(
        (response: any) => {
          console.log('Evento registrado correctamente:', response);
          alert('Evento registrado correctamente');
          this.router.navigate(['/eventos-academicos']);
          this.cargando = false;
        },
        (error) => {
          console.error('Error al registrar evento:', error);
          alert('Error al registrar el evento: ' + (error.error?.message || 'Error desconocido'));
          this.cargando = false;
        }
      );
    }
  }

  /**
   * Cancela el registro y regresa a la lista
   */
  cancelar(): void {
    this.router.navigate(['/eventos-academicos']);
  }
}
