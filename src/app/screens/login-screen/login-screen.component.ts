import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {
  //Variables para la vista
  public username:string = "";
  public password:string = "";
  public type: string = "password";
  public errors:any = {};
  public load:boolean = false;

  constructor(
    public router: Router,
    private facadeService: FacadeService
  ) { }

  ngOnInit(): void {

  }

  public login(){
    this.errors = {};
    this.errors = this.facadeService.validarLogin(this.username, this.password);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    // TODO: Aquí va la llamada al servicio para validar el login
    console.log("Pasó la validación");

  }

  //Metodo para mostrar/ocultar la contraseña
  //Opción 1: Cambiar el tipo de input de password a text
  showHidePassword():void{
    if(this.type == "password"){
      this.type = "text";
    }else{
      this.type = "password";
    }
  }

  //Opción 2: Cambiar el icono de ojo abierto/cerrado
  public showPassword(){
    this.type = this.type === "password" ? "text" : "password";
  }

  public registrar(){
    this.router.navigate(["registro-usuarios"]);
  }

}
