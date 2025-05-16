import { Component, ViewChild, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DatabaseService, StudentData, SortOptions } from '../../services/database.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

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
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatDividerModule,
    MatFormFieldModule,  ]
})
export class HomComponentComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['matricula', 'apellido_paterno', 'apellido_materno', 'nombre', 'email'];
  dataSource = new MatTableDataSource<StudentData>();
  totalStudents = 0;
  currentPageSize = 10;
  isLoading = true;
  errorMessage = '';
  private searchTerms = new Subject<string>();
  currentSortOptions?: SortOptions;

public isSearchExpanded: boolean = false;
public isUserMenuOpen: boolean = false;
public userDisplayName: string | null = null;
public isSorting: boolean = false;
public userEmail: string = '';
public selectedLicensePlate: string = '';
activeRecordsColumns: string[] = ['placa', 'entry_time', 'actions'];
activeVehicleRecords: any[] = [];
historicalRecords: any[] = [];
historicalRecordsColumns: string[] = ['placa', 'entry_time', 'exit_time', 'duration'];


  constructor(
    private dbService: DatabaseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => this.performSearch(term));
  }

  ngOnInit() {
    this.loadStudentsPage();
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.sort.sortChange.subscribe((sort: Sort) => {
        this.currentSortOptions = {
          active: sort.active as keyof StudentData,
          direction: sort.direction as 'asc' | 'desc' | ''
        };
        this.paginator.pageIndex = 0;
        this.loadStudentsPage();
      });
    }
  }

  loadStudentsPage() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.dbService.getStudents(
      this.paginator?.pageIndex || 0,
      this.currentPageSize,
      this.currentSortOptions
    ).subscribe({
      next: (response) => {
        this.dataSource.data = response.results;
        this.totalStudents = response.count;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSearch() {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  toggleUserMenu() {
  this.isUserMenuOpen = !this.isUserMenuOpen;
}

  onPageChange(event: any) {
    this.currentPageSize = event.pageSize;
    this.loadStudentsPage();
  }

  public logout(): void {
    // TODO: Implement logout logic, e.g., call an AuthService and navigate to login
    console.log('Logout clicked');
    this.router.navigate(["login"]);
  }

calculateDuration(record: any): string {
  if (!record.entry_time || !record.exit_time) {
    return '—';
  }
  const entry = new Date(record.entry_time);
  const exit = new Date(record.exit_time);
  const diffMs = exit.getTime() - entry.getTime();
  if (isNaN(diffMs) || diffMs < 0) {
    return '—';
  }
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0
    ? `${hours}h ${mins}m`
    : `${mins}m`;
}

registerVehicleEntry() {
  // TODO: Implement the logic for registering a vehicle entry
  // For now, just log to the console to avoid errors
  console.log('registerVehicleEntry called');
}

formatDateTime(dateTime: string | Date): string {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) return '';
  // Format as 'dd/MM/yyyy HH:mm'
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

sortData(event: any): void {
  // Implement sorting logic here or leave empty if handled by MatTableDataSource
  // Example: if using MatTableDataSource, you may not need to do anything
}

navigateToUserPage(row: any): void {
    // Replace 'user-details' and 'id' with your actual route and identifier
    this.router.navigate(['/user-details', row.id]);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerms.next(filterValue.trim());
  }

  private performSearch(term: string) {
    if (!term) {
      this.loadStudentsPage();
      return;
    }

    this.isLoading = true;
    this.dbService.searchStudents(term, this.paginator?.pageIndex || 0, this.currentPageSize)
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.results;
          this.totalStudents = response.count;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
}