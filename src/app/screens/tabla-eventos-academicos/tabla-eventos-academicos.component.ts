import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { EventosService } from 'src/app/services/eventos.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditarComponent } from 'src/app/modals/editar/editar.component';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';

interface DatosEvento {
  id: number;
  nombre: string;
  tipo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  publico_objetivo: string;
  programa_educativo: string;
  responsable: any;
  responsable_nombre?: string;
  descripcion: string;
  cupo_maximo: number;
}

@Component({
  selector: 'app-tabla-eventos-academicos',
  templateUrl: './tabla-eventos-academicos.component.html',
  styleUrls: ['./tabla-eventos-academicos.component.scss']
})
export class TablaEventosAcademicosComponent implements OnInit {

  public name_user: string = "";
  public rol: string = "";
  public userId: string = "";
  public token: string = "";
  public lista_eventos: any[] = [];
  public filtroTexto: string = "";
  private maestroActualId: number | null = null;

  // Para la tabla
  displayedColumns: string[] = ['id', 'nombre', 'tipo', 'fecha', 'hora_inicio', 'hora_fin', 'lugar', 'responsable', 'cupo_maximo', 'editar', 'eliminar'];
  dataSource: MatTableDataSource<DatosEvento> = new MatTableDataSource<DatosEvento>(this.lista_eventos as DatosEvento[]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  constructor(
    public facadeService: FacadeService,
    public eventosService: EventosService,
    private maestrosService: MaestrosService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    this.userId = this.facadeService.getUserId();
    // Validar que haya inicio de sesión
    this.token = this.facadeService.getSessionToken();
    console.log("Token: ", this.token);
    if (this.token == "") {
      this.router.navigate(["/"]);
    }
    // Ajustar columnas según el rol
    if (!this.esAdmin()) {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'eliminar' && col !== 'editar');
    }

    // Si es maestro, obtener su ID de maestro para filtrar eventos
    if (this.esMaestro()) {
      this.obtenerIdMaestro();
    } else {
      this.obtenerEventos();
    }
  }

  // Obtener el ID del maestro actual
  private obtenerIdMaestro() {
    this.maestrosService.obtenerListaMaestros().subscribe(
      (response) => {
        // Buscar el maestro que corresponde al usuario actual
        const maestroActual = response.find((m: any) => m.user && m.user.id === parseInt(this.userId));
        if (maestroActual) {
          this.maestroActualId = maestroActual.id;
        }
        this.obtenerEventos();
      },
      (error) => {
        console.error('Error al obtener maestros:', error);
        this.obtenerEventos(); // Intentar cargar eventos de todas formas
      }
    );
  }

  // Obtener eventos académicos
  public obtenerEventos() {
    this.eventosService.obtenerEventos().subscribe(
      (response) => {
        let lista_eventos = response;

        // Filtrar eventos según el rol del usuario
        if (!this.esAdmin()) {
          lista_eventos = lista_eventos.filter((evento: any) => {
            const publicoObjetivo = evento.publico_objetivo || '';

            if (this.esMaestro()) {
              // Maestro ve: sus propios eventos + eventos para Profesores + eventos Público general
              const esResponsable = evento.responsable && evento.responsable.id === this.maestroActualId;
              const esProfesores = publicoObjetivo.includes('Profesores');
              const esPublicoGeneral = publicoObjetivo.includes('Público general');
              return esResponsable || esProfesores || esPublicoGeneral;
            } else {
              // Alumno ve: eventos para Estudiantes + eventos Público general
              const esEstudiantes = publicoObjetivo.includes('Estudiantes');
              const esPublicoGeneral = publicoObjetivo.includes('Público general');
              return esEstudiantes || esPublicoGeneral;
            }
          });
        }

        this.lista_eventos = lista_eventos;
        console.log("Lista eventos filtrada: ", this.lista_eventos);

        if (this.lista_eventos.length > 0) {
          this.lista_eventos.forEach(evento => {
            // Extraer nombre del responsable si existe
            if (evento.responsable && evento.responsable.user) {
              evento.responsable_nombre = `${evento.responsable.user.first_name} ${evento.responsable.user.last_name}`;
            } else if (evento.responsable) {
              evento.responsable_nombre = evento.responsable.first_name + ' ' + evento.responsable.last_name;
            } else {
              evento.responsable_nombre = 'Sin responsable';
            }
          });

          this.dataSource = new MatTableDataSource<DatosEvento>(this.lista_eventos as DatosEvento[]);
          this.cdr.detectChanges();
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;

          // Filtro personalizado
          this.dataSource.filterPredicate = (data, filter: string) => {
            const texto = (data.nombre + ' ' + data.tipo + ' ' + data.lugar).toLowerCase();
            return texto.includes(filter.trim().toLowerCase());
          };

          // Acceso a propiedades para ordenamiento
          this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
              case 'responsable':
                return (item.responsable_nombre || '').toLowerCase();
              case 'fecha':
                return new Date(item.fecha).getTime();
              default:
                return item[property];
            }
          };
        }
      },
      (error) => {
        console.error('Error al obtener eventos:', error);
        alert('Error al obtener los eventos');
      }
    );
  }

  // Aplicar filtro a la tabla
  aplicarFiltro(event: any) {
    const filterValue = event.target.value;
    this.filtroTexto = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.filtroTexto;
  }

  // Limpiar filtro
  limpiarFiltro() {
    this.filtroTexto = '';
    this.dataSource.filter = '';
  }

  // Ir a editar evento
  goEditar(id: number) {
    console.log('Editar evento:', id);

    // Buscar el evento en la lista
    const evento = this.lista_eventos.find(e => e.id === id);

    if (evento) {
      const dialogRef = this.dialog.open(EditarComponent, {
        data: { evento: evento, tipo: 'evento' },
        width: '700px',
        maxHeight: '90vh'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.confirmar) {
          // Usuario confirmó editar, navegar al formulario de edición
          console.log('Navegando a formulario de edición con ID:', id);
          this.router.navigate(['/eventos-academicos/editar', id]);
        }
      });
    }
  }

  // Eliminar evento
  delete(id: number) {
    const dialogRef = this.dialog.open(EliminarUserModalComponent, {
      data: { id: id, rol: 'evento académico' },
      width: '700px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isDelete) {
        this.eventosService.eliminarEvento(id).subscribe(
          (response) => {
            console.log('Evento eliminado:', response);
            alert('Evento eliminado correctamente');
            this.obtenerEventos();
          },
          (error) => {
            console.error('Error al eliminar evento:', error);
            alert('Error al eliminar el evento');
          }
        );
      }
    });
  }

  // Registrar nuevo evento
  irRegistrar() {
    this.router.navigate(['/eventos-academicos/registrar']);
  }

  // Verificar si el usuario es administrador
  esAdmin(): boolean {
    return this.rol === 'administrador';
  }

  // Verificar si el usuario es maestro
  esMaestro(): boolean {
    return this.rol === 'maestro';
  }

  // Verificar si puede registrar eventos (solo admin)
  puedeRegistrarEventos(): boolean {
    return this.esAdmin();
  }
}
