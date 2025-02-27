import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CsvService } from '../../services/csv.service';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

interface CsvRow {
  Matricula: string;
  'Apellido Paterno': string;
  'Apellido Materno': string;
  Nombre: string;
  Email: string;
  [key: string]: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table-component.component.html',
  styleUrls: ['./table-component.component.scss'],
  standalone: true,
  imports: [MatTableModule, MatProgressSpinnerModule, CommonModule]
})
export class TableComponent implements OnInit {
  displayedColumns: string[] = ['Matricula', 'Apellido Paterno', 'Apellido Materno', 'Nombre', 'Email'];
  dataSource: CsvRow[] = [];
  errorMessage: string = '';
  isLoading: boolean = true;
  isBrowser: boolean;

  constructor(
    private csvService: CsvService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      console.log('Intentando cargar CSV en el navegador');
      this.tryLoadCSV();
    } else {
      console.log('Ejecutando en SSR, usando datos de demostración');
      this.useDemoData();
    }
  }

  tryLoadCSV(): void {
    const urls = [
      'assets/archivo_final.csv',
      './assets/archivo_final.csv',
      './Datos/archivo_final.csv',
      '../Datos/archivo_final.csv'
    ];

    this.loadCSVFromUrl(urls, 0);
  }

  loadCSVFromUrl(urls: string[], index: number): void {
    if (index >= urls.length) {
      console.warn("No se pudo cargar el CSV desde ninguna ruta, usando datos de demostración");
      this.useDemoData();
      this.errorMessage = "No se pudo cargar el archivo CSV original. Se muestran datos de demostración.";
      return;
    }

    const url = urls[index];
    console.log(`Intentando cargar CSV desde: ${url}`);
    
    this.csvService.cargarCSV(url).subscribe({
      next: (data: CsvRow[]) => {
        if (data && data.length > 0) {
          console.log('CSV cargado exitosamente:', data.length, 'filas');
          this.dataSource = data;
          this.isLoading = false;
          this.errorMessage = '';
        } else {
          console.warn(`CSV cargado desde ${url} pero no contiene datos`);
          this.loadCSVFromUrl(urls, index + 1);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.warn(`Error cargando CSV desde ${url}:`, error);
        this.loadCSVFromUrl(urls, index + 1);
      }
    });
  }

  useDemoData(): void {
    this.csvService.getDatosDemostracion().subscribe({
      next: (demoData: CsvRow[]) => {
        this.dataSource = demoData;
        this.isLoading = false;
        this.errorMessage = "Usando datos de demostración porque no se pudo cargar el archivo CSV.";
      }
    });
  }
}