import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-registro-alumnos',
  templateUrl: './registro-alumnos.component.html',
  styleUrls: ['./registro-alumnos.component.scss']
})
export class RegistroAlumnosComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  public alumno:any = {};
  public errors:any = {};
  public editar:boolean = false;
  public token: string = "";
  public idUser: Number = 0;

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  constructor(
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private alumnosService: AlumnosService,
    private facadeService: FacadeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.alumno = this.alumnosService.esquemaAlumno();
    // Rol del usuario
    this.alumno.rol = this.rol;
  }

  //Funciones para password
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

  public regresar(){
    this.location.back();
  }


  public actualizar(){
    // TODO: Implementar actualización
  }

  // Función para los campos solo de datos alfabeticos
  public soloLetras(event: KeyboardEvent) {
  const char = event.key;

  // Permitir teclas especiales (backspace, delete, tab, flechas, etc.)
  if (event.key.length > 1) {
    return; // Permite teclas como Backspace, Delete, ArrowLeft, etc.
  }

  const charCode = event.key.charCodeAt(0);
  if (
    !(charCode >= 65 && charCode <= 90) &&   // Letras mayúsculas A-Z
    !(charCode >= 97 && charCode <= 122) &&  // Letras minúsculas a-z
    !(charCode >= 192 && charCode <= 255) && // Acentos y ñ
    charCode !== 32                          // Espacio
  ) {
    event.preventDefault();
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

      this.alumno.edad = edad.toString();
    }
  }


    public registrar(){
    //Validamos si el formulario está lleno y correcto
    this.errors = {};
    this.errors = this.alumnosService.validarAlumno(this.alumno, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }

    // Lógica para registrar un nuevo alumno

     this.alumno.fecha_nacimiento = this.limpiarFecha(this.alumno.fecha_nacimiento);
      console.log("FECHA ENVIADA:", this.alumno.fecha_nacimiento);


    if(this.alumno.password == this.alumno.confirmar_password){ //si las contraseñas coinciden
      this.alumnosService.registrarAlumnos(this.alumno).subscribe( //
        (response) => {
          // Redirigir o mostrar mensaje de éxito
          alert("Alumno registrado exitosamente");
          console.log("Alumno registrado: ", response);
          if(this.token && this.token !== ""){ //si existe el token de inicio de sesion, mandalo a la vista de alumnos y si no mandalo al login
            this.router.navigate(["alumnos"]);
          }else{
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          // Manejar errores de la API
          alert("Error al registrar alumno");
          console.error("Error al registrar alumno: ", error);
        }
      );
    }else{
      alert("Las contraseñas no coinciden");
      this.alumno.password=""; //resetear los campos
      this.alumno.confirmar_password="";
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
