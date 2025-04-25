import { Component, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DatabaseService, StudentData, SortOptions } from '../../services/database.service';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Importaciones de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

// Importaciones necesarias para directivas y pipes
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  templateUrl: './hom-component.component.html',
  styleUrls: ['./hom-component.component.scss'],
  standalone: true,
  imports: [
    // Módulos requeridos
    CommonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSortModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class HomComponentComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('input') searchInputRef!: ElementRef;

  displayedColumns: string[] = ['matricula', 'apellido_paterno', 'apellido_materno', 'nombre', 'email', 'registrar'];
  dataSource = new MatTableDataSource<StudentData>();
  errorMessage = '';
  isLoading = true;
  totalStudents = 0;
  currentPageSize = 10;
  private searchTerms = new Subject<string>();

  isSearchExpanded = false;
  isUserMenuOpen = false;
  userDisplayName = 'Usuario Demo';
  userEmail = 'usuario@ejemplo.com';
  isSorting = false; // Añadido para solucionar error

  currentSortOptions: SortOptions | undefined;

  constructor(
    private router: Router,
    private dbService: DatabaseService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(term => this.performSearch(term))
    ).subscribe();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.isUserMenuOpen && !(event.target as HTMLElement).closest('.user-menu-container')) {
      this.isUserMenuOpen = false;
      this.cdr.detectChanges();
    }
  }

  ngOnInit(): void {
    this.loadStudentsPage();
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.paginator.page.subscribe(() => {
        this.currentPageSize = this.paginator.pageSize;
        this.loadStudentsPage();
      });
    }

    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.handleSortChange(sort);
      });
    }
  }

  loadStudentsPage() {
    this.isLoading = true;
    const pageIndex = this.paginator?.pageIndex || 0;

    this.dbService.getStudents(pageIndex, this.currentPageSize, this.currentSortOptions)
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.results;
          this.totalStudents = response.count;
          this.isLoading = false;
          this.cdr.detectChanges();
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
      this.loadStudentsPage();
      return;
    }

    this.isLoading = true;
    this.dbService.searchStudents(term).subscribe({
      next: (students) => {
        this.dataSource.data = students;
        this.totalStudents = students.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error en la búsqueda:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  handleSortChange(sort: Sort): void {
    this.isSorting = true; // Indicar que estamos ordenando
    this.currentSortOptions = sort.direction ? {
      active: sort.active as keyof StudentData,
      direction: sort.direction
    } : undefined;

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadStudentsPage();
    this.isSorting = false; // Finalizar ordenamiento
  }

  navigateToUserPage(student: StudentData): void {
    if (student?.matricula) {
      this.router.navigate(['/user', student.matricula], {
        state: { userData: student }
      });
    }
  }

  // Métodos de UI mantienen la misma funcionalidad
  toggleSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;
    if (this.isSearchExpanded && this.searchInputRef) {
      setTimeout(() => this.searchInputRef.nativeElement.focus(), 300);
    }
    this.cdr.detectChanges();
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.cdr.detectChanges();
  }

  logout() {
    this.router.navigate(["login"]);
  }

  // Método para manejar el cambio de página
  onPageChange(event: PageEvent): void {
    this.currentPageSize = event.pageSize;
    this.loadStudentsPage();
  }
}
