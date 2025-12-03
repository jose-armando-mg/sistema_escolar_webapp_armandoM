import { Component, OnInit } from '@angular/core';
import DatalabelsPlugin from 'chartjs-plugin-datalabels';
import { EventosService } from 'src/app/services/eventos.service';
import { AdministradoresService } from 'src/app/services/administradores.service';


@Component({
  selector: 'app-graficas-screen',
  templateUrl: './graficas-screen.component.html',
  styleUrls: ['./graficas-screen.component.scss']
})
export class GraficasScreenComponent implements OnInit {

  public total_user: any = {};
  public total_eventos: any = {};

  lineChartData = {
    labels: ["Conferencia", "Taller", "Seminario", "Concurso"],
    datasets: [
      {
        data:[0, 0, 0, 0],
        label: 'Eventos Académicos',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#82D3FB',
          '#FB82F5'
        ]
      }
    ]
  };

  lineChartOption = { responsive:false };
  lineChartPlugins = [ DatalabelsPlugin ];

  barChartData = {
    labels: ["Conferencia", "Taller", "Seminario", "Concurso"],
    datasets: [
      {
        data:[0, 0, 0, 0],
        label: 'Eventos Académicos',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#82D3FB',
          '#FB82F5'
        ]
      }
    ]
  };

  barChartOption = { responsive:false };
  barChartPlugins = [ DatalabelsPlugin ];

  pieChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        backgroundColor: [
          '#FCFF44',
          '#F1C8F2',
          '#31E731'
        ]
      }
    ]
  };

  pieChartOption = { responsive:false };
  pieChartPlugins = [ DatalabelsPlugin ];

  doughnutChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        backgroundColor: ['#F88406','#FCFF44','#31E7E7']
      }
    ]
  };

  doughnutChartOption = { responsive:false };
  doughnutChartPlugins = [ DatalabelsPlugin ];


  constructor(
    private administradoresServices: AdministradoresService,
    private eventosService: EventosService) {}

  ngOnInit(): void {
    this.obtenerTotalUsers();
    this.obtenerTotalEventos();
  }

public obtenerTotalEventos() {
  this.eventosService.getTotalEventos().subscribe(
    (response: any) => {
      this.total_eventos = response;
      console.log("Eventos:", this.total_eventos);

      // soportar diferentes nombres de campo que devuelva la API
      const conferencia = response.conferencia ?? response.conferences ?? response.conference ?? response.total_conferencia ?? 0;
      const taller = response.taller ?? response.talleres ?? response.workshop ?? response.workshops ?? 0;
      const seminario = response.seminario ?? response.seminarios ?? response.seminar ?? response.seminars ?? 0;
      const concurso = response.concurso ?? response.concursos ?? response.contest ?? response.contests ?? 0;

      // Actualizar Line Chart (reemplazando objeto para detección de cambios)
      this.lineChartData = {
        ...this.lineChartData,
        datasets: [
          {
            ...this.lineChartData.datasets[0],
            data: [conferencia, taller, seminario, concurso]
          }
        ]
      };

      // Actualizar Bar Chart
      this.barChartData = {
        ...this.barChartData,
        datasets: [
          {
            ...this.barChartData.datasets[0],
            data: [conferencia, taller, seminario, concurso]
          }
        ]
      };

    },
    error => console.log("Error al obtener eventos", error)
  );
}

 public obtenerTotalUsers() {
    this.administradoresServices.getTotalUsuarios().subscribe(
      (response: any) => {

        this.total_user = response;
        console.log("Total usuarios: ", this.total_user);

        // soportar diferentes nombres de campo que pueda devolver la API
        const adminCount = response.admins ?? response.total_admins ?? response.totalAdmins ?? 0;
        const maestrosCount = response.maestros ?? response.total_maestros ?? response.totalMaestros ?? 0;
        const alumnosCount = response.alumnos ?? response.total_alumnos ?? response.totalAlumnos ?? 0;

        // Reemplazar el objeto completo para asegurar detección de cambios en Angular
        this.pieChartData = {
          ...this.pieChartData,
          datasets: [
            {
              ...this.pieChartData.datasets[0],
              data: [adminCount, maestrosCount, alumnosCount]
            }
          ]
        };

        this.doughnutChartData = {
          ...this.doughnutChartData,
          datasets: [
            {
              ...this.doughnutChartData.datasets[0],
              data: [adminCount, maestrosCount, alumnosCount]
            }
          ]
        };
      },
      error => {
        console.log("Error al obtener total de usuarios ", error);
        alert("No se pudo obtener el total de cada rol de usuarios");
      }
    );
  }

}
