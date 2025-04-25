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
import { VehicleService, VehicleRecord, UserVehicleInfo } from '../../services/vehicle/vehicle.service';

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
    DatePipe,
  ],
  providers: [DatePipe]
})
export class UserComponentComponent implements OnInit {
  userData: StudentData | null = null;
  matricula: string = '';
  activeVehicleRecords = new MatTableDataSource<VehicleRecord>();
  historicalRecords = new MatTableDataSource<VehicleRecord>();
  userVehicleInfo: UserVehicleInfo | null = null;

  activeRecordsColumns: string[] = ['license_plate', 'entry_time', 'actions'];
  historicalRecordsColumns: string[] = ['license_plate', 'date', 'entry_time', 'exit_time', 'duration'];

  newLicensePlate: string = '';
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
      const [active, historical, info] = await Promise.all([
        lastValueFrom(this.vehicleService.getActiveUserVehicleRecords(this.matricula)),
        lastValueFrom(this.vehicleService.getHistoricalUserVehicleRecords(this.matricula)),
        lastValueFrom(this.vehicleService.getUserVehicleInfo(this.matricula))
      ]);

      this.activeVehicleRecords.data = active || [];
      this.historicalRecords.data = historical || [];
      this.userVehicleInfo = info || { license_plates: [] };

    } catch (error) {
      this.showError('Error al cargar los datos de vehículos');
      console.error('Error loading vehicle data:', error);
    } finally {
      this.loading = false;
    }
  }

  async registerNewVehicle() {
    if (!this.newLicensePlate.trim()) {
      this.showError('Por favor ingrese una placa válida');
      return;
    }

    try {
      await lastValueFrom(
        this.vehicleService.associateLicensePlateWithUser(
          this.matricula,
          this.newLicensePlate.toUpperCase()
        )
      );
      this.showSuccess('Vehículo registrado correctamente');
      this.newLicensePlate = '';
      await this.loadVehicleData();
    } catch (error) {
      this.showError('Error al registrar el vehículo');
      console.error('Error registering vehicle:', error);
    }
  }

  // Métodos de navegación y acciones
  goBack() {
    this.router.navigate(['/home']);
  }

  async registerVehicleEntry() {
    if (!this.selectedLicensePlate) {
      this.showError('Selecciona una placa válida');
      return;
    }

    try {
      await lastValueFrom(
        this.vehicleService.registerEntry(
          this.matricula,
          this.selectedLicensePlate
        )
      );
      this.showSuccess('Entrada registrada exitosamente');
      await this.loadVehicleData();
    } catch (error) {
      this.showError('Error al registrar la entrada');
      console.error('Entry error:', error);
    }
  }

  async registerVehicleExit(recordId: string) {
    try {
      await lastValueFrom(
        this.vehicleService.registerExit(recordId)
      );
      this.showSuccess('Salida registrada exitosamente');
      await this.loadVehicleData();
    } catch (error) {
      this.showError('Error al registrar la salida');
      console.error('Exit error:', error);
    }
  }

  async removeVehicle(plate: string) {
    try {
      await lastValueFrom(
        this.vehicleService.removeLicensePlateFromUser(
          this.matricula,
          plate
        )
      );
      this.showSuccess('Vehículo eliminado correctamente');
      await this.loadVehicleData();
    } catch (error) {
      this.showError('Error al eliminar el vehículo');
      console.error('Remove vehicle error:', error);
    }
  }

  // Helpers
  get activeRecordsCount(): number {
    return this.activeVehicleRecords.data.length;
  }

  formatDateTime(date: string): string {
    return this.datePipe.transform(date, 'medium') || 'Fecha inválida';
  }

  calculateDuration(entry: string, exit?: string): string {
    if (!exit) return 'En curso';
    const entryTime = new Date(entry).getTime();
    const exitTime = new Date(exit).getTime();
    const diffMs = exitTime - entryTime;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
