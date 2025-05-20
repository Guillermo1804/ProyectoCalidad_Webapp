import { Component, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DatabaseService, StudentData, SortOptions } from '../../services/database.service';
import { FacadeServiceService } from '../../services/facade.service';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Define VehicleRecord interface locally if not imported from anywhere else
interface VehicleRecord {
  id?: string;
  placa: string;
  entry_time: string | Date;
  exit_time?: string | Date;
  duration?: string;
}

@Component({
  selector: 'app-hom-component',
  templateUrl: './hom-component.component.html',
  styleUrls: ['./hom-component.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSnackBarModule
  ]
})
export class HomComponentComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Configuración de la tabla principal
  displayedColumns: string[] = ['matricula', 'apellido_paterno', 'apellido_materno', 'nombre', 'email'];
  dataSource = new MatTableDataSource<StudentData>();
  totalStudents = 0;
  currentPageSize = 10;
  currentPageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Estados y carga
  isLoading = true;
  detailsLoading = false;
  errorMessage = '';
  private searchTerms = new Subject<string>();
  currentSortOptions?: SortOptions;

  // Interfaz de usuario
  isSearchExpanded = false;
  isUserMenuOpen = false;
  userDisplayName = 'Usuario';
  userEmail = 'usuario@ejemplo.com';
  selectedLicensePlate = '';

  // Registros vehiculares
  activeRecordsColumns: string[] = ['placa', 'entry_time', 'actions'];
  activeVehiclesDataSource = new MatTableDataSource<VehicleRecord>([]);
  activeVehicleRecords: VehicleRecord[] = [];
  historicalRecordsColumns: string[] = ['placa', 'entry_time', 'exit_time', 'duration'];
  historicalDataSource = new MatTableDataSource<VehicleRecord>([]);
  historicalRecords: VehicleRecord[] = [];

  // Estudiante seleccionado
  selectedStudent: StudentData | null = null;
  selectedTabIndex = 0;

  constructor(
    private dbService: DatabaseService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackBar: MatSnackBar,
    private facadeService: FacadeServiceService // Agrega el FacadeServiceService
  ) {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => this.performSearch(term));
  }

  ngOnInit(): void {
    this.loadStudentsPage();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.setupSorting();
  }

  // === CORRECCIÓN 1: Métodos faltantes añadidos ===
  onPageChange(event: PageEvent): void {
    this.currentPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.loadStudentsPage();
  }

  sortData(sort: Sort): void {
    this.currentSortOptions = {
      active: sort.active as keyof StudentData,
      direction: sort.direction as 'asc' | 'desc' | ''
    };
    this.paginator.firstPage();
    this.loadStudentsPage();
  }

  // ==============================================

  private setupSorting(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.currentSortOptions = {
          active: sort.active as keyof StudentData,
          direction: sort.direction as 'asc' | 'desc' | ''
        };
        this.paginator.firstPage();
        this.loadStudentsPage();
      });
    }
  }

  loadStudentsPage(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dbService.getStudents(
      this.currentPageIndex,
      this.currentPageSize,
      this.currentSortOptions
    ).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.results;
        this.totalStudents = response.count;
      },
      error: (error) => this.handleError('Error cargando estudiantes', error)
    });
  }

  performSearch(term: string): void {
    const searchTerm = term.trim();

    if (!searchTerm) {
      this.loadStudentsPage();
      return;
    }

    this.isLoading = true;
    this.currentPageIndex = 0;  // Resetear a primera página

    // Forzar nueva instancia del dataSource
    this.dataSource = new MatTableDataSource<StudentData>([]);

    this.dbService.searchStudents(searchTerm, this.currentPageIndex, this.currentPageSize)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges(); // Forzar actualización de vista
        })
      )
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.results;
          this.totalStudents = response.count;

          // Resetear paginador
          if (this.paginator) {
            this.paginator.firstPage();
          }
        },
        error: (error) => this.handleError('Error en búsqueda', error)
      });
  }

  selectStudent(student: StudentData): void {
    this.selectedStudent = student;
    this.selectedTabIndex = 1; // Cambiar a la pestaña de información
    this.loadVehicleRecords();
  }

  loadVehicleRecords(): void {
    if (!this.selectedStudent) return;

    this.detailsLoading = true;

    this.facadeService.getActiveRecords(this.selectedStudent.matricula)
      .pipe(finalize(() => this.detailsLoading = false))
      .subscribe({
        next: (active) => {
          const records = Array.isArray(active) ? active : [];
          this.activeVehiclesDataSource.data = records;
          this.activeVehicleRecords = records;
        },
        error: (error) => this.handleError('Error cargando registros activos', error)
      });

    this.facadeService.getHistoricalRecords(this.selectedStudent.matricula)
      .pipe(finalize(() => this.detailsLoading = false))
      .subscribe({
        next: (history) => {
          const records = Array.isArray(history) ? history : [];
          this.historicalDataSource.data = records;
          this.historicalRecords = records;
        },
        error: (error) => this.handleError('Error cargando historial', error)
      });
  }

  registerVehicleEntry(): void {
    if (!this.selectedStudent || !this.selectedLicensePlate) {
      this.showSnackBar('Por favor complete todos los campos requeridos');
      return;
    }

    this.detailsLoading = true;
    // Cambia a usar facadeService para registrar la entrada del vehículo
    this.facadeService.registerVehicleEntry(
      this.selectedStudent.matricula,
      this.selectedLicensePlate
    ).pipe(
      finalize(() => {
        this.detailsLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.selectedLicensePlate = '';
        this.loadVehicleRecords();
        this.showSnackBar('Entrada registrada exitosamente');
      },
      error: (error) => this.handleError('Error registrando entrada', error)
    });
  }

  registerVehicleExit(record: VehicleRecord): void {
    if (!record.id) return;

    this.detailsLoading = true;
    // Cambia a usar facadeService para registrar la salida del vehículo
    this.facadeService.registerVehicleExit(record.id)
      .pipe(
        finalize(() => {
          this.detailsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadVehicleRecords();
          this.showSnackBar('Salida registrada exitosamente');
        },
        error: (error) => this.handleError('Error registrando salida', error)
      });
  }

  backToStudentList(): void {
    this.selectedStudent = null;
    this.selectedTabIndex = 0;
    this.loadStudentsPage();
  }

  private handleError(context: string, error: Error): void {
    console.error(`${context}:`, error);
    this.errorMessage = `${context}: ${error.message}`;
    this.showSnackBar(this.errorMessage, 5000);
  }

  private showSnackBar(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Cerrar', { duration });
  }

  // Métodos de utilidad
  formatDateTime(dateTime: string | Date): string {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return isNaN(date.getTime()) ? '' :
      `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }

  calculateDuration(record: VehicleRecord): string {
    if (!record.entry_time || !record.exit_time) return '-';

    const entry = new Date(record.entry_time);
    const exit = new Date(record.exit_time);
    const diff = Math.abs(exit.getTime() - entry.getTime());

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerms.next(filterValue.trim());
  }

  toggleSearch(): void {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
