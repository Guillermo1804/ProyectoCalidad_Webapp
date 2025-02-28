import { Component, ViewChild, OnInit, PLATFORM_ID, Inject, AfterViewInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
//import { CsvService } from '../../services/csv.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';

interface CsvRow {
  Matricula: string;
  'Apellido Paterno': string;
  'Apellido Materno': string;
  Nombre: string;
  Email: string;
  [key: string]: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './hom-component.component.html',
  styleUrls: ['./hom-component.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    ScrollingModule,
    CommonModule
  ]
})
export class HomComponentComponent implements OnInit, AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['Matricula', 'Apellido Paterno', 'Apellido Materno', 'Nombre', 'Email'];
  dataSource: MatTableDataSource<CsvRow>;
  errorMessage: string = '';
  isLoading: boolean = true;
  isBrowser: boolean;

  constructor(
    private router: Router,
    //private csvService: CsvService,
    private paginatorIntl: MatPaginatorIntl,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.dataSource = new MatTableDataSource<CsvRow>([]);
    this.initializePaginatorLabels();
  }

  private initializePaginatorLabels() {
    this.paginatorIntl.itemsPerPageLabel = 'Items por página:';
    this.paginatorIntl.nextPageLabel = 'Siguiente página';
    this.paginatorIntl.previousPageLabel = 'Página anterior';
    this.paginatorIntl.firstPageLabel = 'Primera página';
    this.paginatorIntl.lastPageLabel = 'Última página';
    this.paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    };
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      console.log('Intentando cargar CSV en el navegador');
      this.tryLoadCSV();
      this.initializeVirtualScrolling();
    } else {
      console.log('Ejecutando en SSR, usando datos de demostración');
      //this.useDemoData();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Configurar el filtrado personalizado
    this.dataSource.filterPredicate = (data: CsvRow, filter: string) => {
      const searchStr = filter.toLowerCase();
      return Object.values(data).some(value =>
        value.toString().toLowerCase().includes(searchStr)
      );
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  public goBack() {
    this.router.navigate(["login"]);
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
      //this.useDemoData();
      this.errorMessage = "No se pudo cargar el archivo CSV original. Se muestran datos de demostración.";
      return;
    }

    /*
    const url = urls[index];
    console.log(`Intentando cargar CSV desde: ${url}`);
    this.csvService.cargarCSV(url).subscribe({
      next: (data: CsvRow[]) => {
        if (data && data.length > 0) {
          console.log('CSV cargado exitosamente:', data.length, 'filas');
          this.dataSource.data = data;
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
    */
  }

  /*
  useDemoData(): void {
    this.csvService.getDatosDemostracion().subscribe({
      next: (demoData: CsvRow[]) => {
        this.dataSource.data = demoData;
        this.isLoading = false;
        this.errorMessage = "Usando datos de demostración porque no se pudo cargar el archivo CSV.";
      }
    });
  }
*/
  private initializeVirtualScrolling() {
    this.dataSource.paginator = this.paginator;
    if (this.paginator) {
      this.paginator._intl.itemsPerPageLabel = 'Items por página';
      this.paginator._intl.nextPageLabel = 'Siguiente página';
      this.paginator._intl.previousPageLabel = 'Página anterior';
      this.paginator._intl.firstPageLabel = 'Primera página';
      this.paginator._intl.lastPageLabel = 'Última página';
    }
  }
}
