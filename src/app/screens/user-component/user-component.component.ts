import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importaciones corregidas de Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';

import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { lastValueFrom } from 'rxjs';

import { StudentData } from '../../services/database.service';
import { VehicleService, VehicleRecord, VehicleHistory } from '../../services/vehicle/vehicle.service';

@Component({
  selector: 'app-user-component',
  standalone: true,
  templateUrl: './user-component.component.html',
  styleUrls: ['./user-component.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatOptionModule,
  ],
  providers: [DatePipe]
})
export class UserComponentComponent implements OnInit {
  userData: StudentData | null = null;
  matricula: string = '';
  activeVehicleRecords = new MatTableDataSource<VehicleRecord>([]);
  historicalRecords = new MatTableDataSource<VehicleHistory>([]);

  activeRecordsColumns: string[] = ['placa', 'entry_time', 'actions'];
  historicalRecordsColumns: string[] = ['placa', 'entry_time', 'exit_time', 'duration'];
  selectedLicensePlate: string = '';
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const matricula = params.get('matricula');
      if (!matricula) {
        this.router.navigate(['/home']);
        return;
      }
      this.matricula = matricula;
      this.loadUserData();
      this.loadVehicleData();
    });
  }

  private loadUserData() {
    const state = this.router.getCurrentNavigation()?.extras.state;
    this.userData = state?.['userData'] || this.createDefaultUserData();
  }

  private createDefaultUserData(): StudentData {
    return {
      matricula: this.matricula,
      apellido_paterno: 'Apellido',
      apellido_materno: 'Materno',
      nombre: 'Nombre',
      email: `${this.matricula}@ejemplo.com`,
      fecha_registro: new Date().toISOString()
    };
  }

  async loadVehicleData() {
    this.loading = true;
    try {
      const [active, historical] = await Promise.all([
        lastValueFrom(this.vehicleService.getActiveVehicleRecords(this.matricula)),
        lastValueFrom(this.vehicleService.getHistoricalVehicleRecords(this.matricula))
      ]);

      this.activeVehicleRecords.data = active;
      this.historicalRecords.data = historical;

    } catch (error) {
      this.showError('Error al cargar registros vehiculares');
      console.error('Detalle del error:', error);
    } finally {
      this.loading = false;
    }
  }

  async registerVehicleEntry() {
    if (!this.selectedLicensePlate?.trim()) {
      this.showError('Ingrese una placa válida');
      return;
    }

    try {
      await lastValueFrom(
        this.vehicleService.registerVehicleEntry(
          this.selectedLicensePlate.toUpperCase(),
          this.matricula
        )
      );
      this.showSuccess('Entrada registrada exitosamente');
      this.selectedLicensePlate = '';
      await this.loadVehicleData();
    } catch (error) {
      this.showError('Error al registrar entrada: ' + (error as Error).message);
      console.error('Detalle del error:', error);
    }
  }

  async registerVehicleExit(recordId: number) {
    try {
      await lastValueFrom(
        this.vehicleService.registerVehicleExit(recordId)
      );
      this.showSuccess('Salida registrada exitosamente');
      await this.loadVehicleData();
    } catch (error) {
      this.showError('Error al registrar salida: ' + (error as Error).message);
      console.error('Detalle del error:', error);
    }
  }

  formatDateTime(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm:ss') || 'Fecha inválida';
  }

  calculateDuration(entry: string, exit: string): string {
    const entryTime = new Date(entry);
    const exitTime = new Date(exit);
    const diff = exitTime.getTime() - entryTime.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
