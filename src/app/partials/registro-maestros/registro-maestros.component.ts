import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { MaestrosService } from 'src/app/services/maestros.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-registro-maestros',
  templateUrl: './registro-maestros.component.html',
  styleUrls: ['./registro-maestros.component.scss']
})
export class RegistroMaestrosComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  public maestro:any = {};
  public errors:any = {};
  public editar:boolean = false;
  public token: string = "";
  public idUser: Number = 0;

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  //Opciones para grado académico
  public areas: any[] = [
      {value: '1', viewValue: 'Desarrollo Web'},
      {value: '2', viewValue: 'Programación'},
      {value: '3', viewValue: 'Bases de datos'},
      {value: '4', viewValue: 'Redes'},
      {value: '5', viewValue: 'Matemáticas'},
    ];

  constructor(
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private maestrosService: MaestrosService,
    private facadeService: FacadeService,
    private router: Router
  ) { }

    ngOnInit(): void {
      //El primer if valida si existe un parámetro en la URL
      if(this.activatedRoute.snapshot.params['id'] != undefined){
        this.editar = true;
        //Asignamos a nuestra variable global el valor del ID que viene por la URL
        this.idUser = this.activatedRoute.snapshot.params['id'];
        console.log("ID User: ", this.idUser);
        // Bloquear edición si no es el mismo usuario
        const sessionUserId = Number(this.facadeService.getUserId());
        const group = (this.facadeService.getUserGroup() || '').toLowerCase();
        const isAdmin = group === 'admin' || group === 'administrador';
        if (!isAdmin && (!sessionUserId || sessionUserId !== Number(this.idUser))) {
          alert('No tienes permisos para editar datos de otro usuario.');
          this.router.navigate(['maestros']);
          return;
        }
        //Al iniciar la vista asignamos los datos del user
        this.maestro = this.datos_user || {};
        // Asegurar que exista el array materias_json al editar
        this.maestro.materias_json = Array.isArray(this.maestro.materias_json) ? this.maestro.materias_json : [];
        // Marcar materias seleccionadas si estamos editando
        if (this.editar && this.maestro.materias_json) {
          this.materias = this.materias.map(m => ({
            ...m,
            selected: this.maestro.materias_json.includes(m.nombre)
          }));
        }
      }else{
        // Va a registrar un nuevo administrador
        this.maestro = this.maestrosService.esquemaMaestro();
        this.maestro.rol = this.rol;
        this.token = this.facadeService.getSessionToken();
        // Inicializar materias_json para evitar push sobre undefined
        this.maestro.materias_json = Array.isArray(this.maestro.materias_json) ? this.maestro.materias_json : [];
      }
      //Imprimir datos en consola
      console.log("Maestro: ", this.maestro);
    }

  public showPassword() {
    if(this.inputType_1 == 'password'){
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else{
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  public showPwdConfirmar() {
    if(this.inputType_2 == 'password'){
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else{
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  public calcularEdad(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
      const fechaNacimiento = new Date(event.value);
      const hoy = new Date();
      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const mes = hoy.getMonth() - fechaNacimiento.getMonth();

      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }

      this.maestro.edad = edad.toString();
    }
  }

  public regresar(){
    this.location.back();
  }

    public actualizar(){
    // Validación de los datos
    this.errors = {};
      // Validar que solo pueda actualizar su propio registro
      const sessionUserId = Number(this.facadeService.getUserId());
      const group = (this.facadeService.getUserGroup() || '').toLowerCase();
      const isAdmin = group === 'admin' || group === 'administrador';
      if (!isAdmin && (!sessionUserId || sessionUserId !== Number(this.idUser))) {
        alert('Acción no permitida: solo puedes actualizar tus propios datos.');
        return false;
      }
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }

    // Ejecutar el servicio de actualización
    this.maestrosService.actualizarMaestro(this.maestro).subscribe(
      (response) => {
        // Redirigir o mostrar mensaje de éxito
        alert("Maestroo actualizado exitosamente");
        console.log("Maestro actualizado: ", response);
        this.router.navigate(["maestros"]);
      },
      (error) => {
        // Manejar errores de la API
        alert("Error al actualizar maestro");
        console.error("Error al actualizar maestro: ", error);
      }
    );
  }


  public materias:any[] = [
    {value: '1', nombre: 'Aplicaciones Web'},
    {value: '2', nombre: 'Programación 1'},
    {value: '3', nombre: 'Bases de datos'},
    {value: '4', nombre: 'Tecnologías Web'},
    {value: '5', nombre: 'Minería de datos'},
    {value: '6', nombre: 'Desarrollo móvil'},
    {value: '7', nombre: 'Estructuras de datos'},
    {value: '8', nombre: 'Administración de redes'},
    {value: '9', nombre: 'Ingeniería de Software'},
    {value: '10', nombre: 'Administración de S.O.'},
  ];


  onMateriaChange(materia: any) {
      // Asegurar array
      if (!Array.isArray(this.maestro.materias_json)) {
        this.maestro.materias_json = [];
      }

      if (materia.selected) {
        // Evitar duplicados
        if (!this.maestro.materias_json.includes(materia.nombre)) {
          this.maestro.materias_json.push(materia.nombre);
        }
      } else {
        const index = this.maestro.materias_json.indexOf(materia.nombre);
        if (index > -1) {
          this.maestro.materias_json.splice(index, 1);
        }
      }

      console.log("📋 Materias actuales:", this.maestro.materias_json);
    }

  public changeFecha(event: any) {
    console.log(event);
    console.log(event.value.toISOString());

    this.maestro.fecha_nacimiento = event.value.toISOString().split("T")[0];
    console.log("Fecha: ", this.maestro.fecha_nacimiento);
  }

  // Funciones para los checkbox
  public checkboxChange(event: any) {
    if (!Array.isArray(this.maestro.materias_json)) {
      this.maestro.materias_json = [];
    }

    if (event.checked) {
      if (!this.maestro.materias_json.includes(event.source.value)) {
        this.maestro.materias_json.push(event.source.value);
      }
    } else {
      const idx = this.maestro.materias_json.indexOf(event.source.value);
      if (idx > -1) this.maestro.materias_json.splice(idx, 1);
    }
    console.log("Array materias: ", this.maestro.materias_json);
  }

  public revisarSeleccion(nombre: string): boolean {
    if (this.maestro.materias_json) {
      var busqueda = this.maestro.materias_json.find((element: string) => element == nombre);
      if (busqueda != undefined) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public registrar(){
    //Validamos si el formulario está lleno y correcto
    this.errors = {};
    // Para registro, si hay sesión, solo permitir si coincide el id cuando aplica
    const sessionUserId = Number(this.facadeService.getUserId());
    const group = (this.facadeService.getUserGroup() || '').toLowerCase();
    const isAdmin = group === 'admin' || group === 'administrador';
    if (this.editar && !isAdmin && (!sessionUserId || sessionUserId !== Number(this.idUser))) {
      alert('Acción no permitida: solo puedes registrar/editar tus propios datos.');
      return false;
    }
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }

      this.maestro.fecha_nacimiento = this.limpiarFecha(this.maestro.fecha_nacimiento);
      console.log("FECHA ENVIADA:", this.maestro.fecha_nacimiento);


      //Validar la contraseña

    if(this.maestro.password == this.maestro.confirmar_password){
      this.maestrosService.registrarMaestro(this.maestro).subscribe(
        (response) => {
          // Redirigir o mostrar mensaje de éxito
          alert("Maestro registrado exitosamente");
          console.log("Maestro registrado: ", response);
          if(this.token && this.token !== ""){
            this.router.navigate(["maestros"]);
          }else{
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          // Manejar errores de la API
          alert("Error al registrar maestro");
          console.error("Error al registrar maestro: ", error);
        }
      );
    }else{
      alert("Las contraseñas no coinciden");
      this.maestro.password="";
      this.maestro.confirmar_password="";
    }

  }

public soloLetras(event: KeyboardEvent) {
  const char = event.key;

  if (event.key.length > 1) {
    return;
  }

  const charCode = event.key.charCodeAt(0);
  if (
    !(charCode >= 65 && charCode <= 90) &&
    !(charCode >= 97 && charCode <= 122) &&
    !(charCode >= 192 && charCode <= 255) &&
    charCode !== 32
  ) {
    event.preventDefault();
  }
}

  // Función para permitir solo caracteres alfanuméricos (letras y números)
  public soloAlfaNumericos(event: KeyboardEvent) {
    if (event.key.length > 1) {
      return; // Permitir teclas especiales
    }

    const regex = /^[A-Za-z0-9]$/;
    if (!regex.test(event.key)) {
      event.preventDefault();
    }
  }

private limpiarFecha(fecha: any): string {
  if (!fecha) return "";

  // Si viene como objeto Date
  if (fecha instanceof Date) {
    return fecha.toISOString().split("T")[0];
  }

  // Si viene como string con T00:00:00Z
  if (typeof fecha === "string" && fecha.includes("T")) {
    return fecha.split("T")[0];
  }

  // Si ya viene formateada correctamente (YYYY-MM-DD)
  return fecha;
}
}


