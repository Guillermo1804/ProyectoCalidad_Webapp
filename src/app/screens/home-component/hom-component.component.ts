import { Component, ViewChild, OnInit, PLATFORM_ID, Inject, AfterViewInit, ChangeDetectionStrategy, NgZone, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DatabaseService, StudentData } from '../../services/database.service';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './hom-component.component.html',
  styleUrls: ['./hom-component.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  @ViewChild('input') searchInputRef!: ElementRef;

  displayedColumns: string[] = ['Matricula', 'Apellido Paterno', 'Apellido Materno', 'Nombre', 'Email'];
  dataSource: MatTableDataSource<StudentData>;
  errorMessage: string = '';
  isLoading: boolean = true;
  isBrowser: boolean;
  totalStudents = 0;
  currentPageSize = 10; // Tamaño de página por defecto
  private searchTerms = new Subject<string>();

  // Nuevas propiedades para UI
  isSearchExpanded: boolean = false;
  isUserMenuOpen: boolean = false;
  userDisplayName: string | null = null;
  userEmail: string | null = null;

  constructor(
    private router: Router,
    private dbService: DatabaseService,
    private paginatorIntl: MatPaginatorIntl,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.dataSource = new MatTableDataSource<StudentData>([]);
    this.initializePaginatorLabels();

    // Configurar el filtrado
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(term => this.performSearch(term))
    ).subscribe();

    // Simular datos de usuario (reemplazar con datos reales del servicio de autenticación)
    this.loadUserData();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    // Cerrar el menú de usuario si se hace clic fuera
    if (this.isUserMenuOpen && !(event.target as HTMLElement).closest('.user-menu-container')) {
      this.isUserMenuOpen = false;
      this.cdr.detectChanges();
    }
  }

  private loadUserData() {
    // Aquí deberías obtener los datos del usuario del servicio de autenticación
    // Por ahora usamos datos simulados
    this.userDisplayName = 'Usuario Demo';
    this.userEmail = 'usuario@ejemplo.com';
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
    this.loadMetadata();
  }

  ngAfterViewInit() {
    if (this.paginator) {
      // No asignar el paginador directamente al dataSource
      // this.dataSource.paginator = this.paginator;
      
      // Configurar el cambio de página
      this.paginator.page.subscribe(() => {
        this.currentPageSize = this.paginator.pageSize;
        this.loadStudentsPage();
      });
    }
    
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  loadMetadata() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.dbService.getMetadata().subscribe({
      next: (metadata) => {
        this.totalStudents = metadata.total;
        if (this.paginator) {
          this.paginator.length = metadata.total;
          this.paginator.pageSize = this.currentPageSize;
        }
        
        // Cargar la primera página
        this.loadStudentsPage();
      },
      error: (error) => {
        console.error('Error cargando metadata:', error);
        this.errorMessage = 'Error cargando la información. Intente recargar la página.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStudentsPage() {
    if (!this.paginator) return;
    this.loadStudentsFromServer(this.paginator.pageIndex, this.paginator.pageSize);
  }

  loadStudentsFromServer(pageIndex: number, pageSize: number) {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.dbService.getStudents(pageIndex, pageSize).subscribe({
      next: (students) => {
        this.ngZone.run(() => {
          this.dataSource.data = students;
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error cargando estudiantes:', error);
        this.errorMessage = 'Error cargando datos de estudiantes.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerms.next(filterValue.trim());
  }

  performSearch(term: string) {
    if (!term) {
      // Si el término está vacío, volver a la vista paginada
      this.loadStudentsPage();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.dbService.searchStudents(term).subscribe({
      next: (students) => {
        this.ngZone.run(() => {
          this.dataSource.data = students;
          if (this.paginator) {
            this.paginator.pageIndex = 0;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error en la búsqueda:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  // Nuevos métodos para UI
  toggleSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;
    this.cdr.detectChanges();
    
    if (this.isSearchExpanded && this.searchInputRef) {
      // Esperar a que la animación termine para enfocar el input
      setTimeout(() => {
        this.searchInputRef.nativeElement.focus();
      }, 300);
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.cdr.detectChanges();
  }

  logout() {
    // Implementar la lógica de cierre de sesión (llamar al servicio de autenticación)
    // Por ahora simplemente redirigimos al login
    this.router.navigate(["login"]);
  }

  public goBack() {
    this.router.navigate(["login"]);
  }

  clearCache() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.dbService.clearCache().subscribe({
      next: () => {
        this.loadMetadata();
      },
      error: (error) => {
        console.error('Error limpiando caché:', error);
        this.isLoading = false;
        this.errorMessage = 'Error limpiando caché. Intente nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }

  // Nuevo método para manejar el evento del paginador
  onPageChange(event: PageEvent) {
    this.currentPageSize = event.pageSize;
    
    // Solo cargamos nuevos datos si no estamos en modo de filtrado/búsqueda
    if (this.searchInputRef?.nativeElement.value === '') {
      this.loadStudentsFromServer(event.pageIndex, event.pageSize);
    }
    
    this.cdr.detectChanges();
  }
}
