import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentData } from '../../services/database.service';
import { VehicleService, VehicleRecord, UserVehicleInfo } from '../../services/vehicle/vehicle.service';

@Component({
  selector: 'app-user-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule, 
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatListModule,
    MatProgressSpinnerModule,
    DatePipe
  ],
  providers: [
    VehicleService
  ],
  templateUrl: './user-component.component.html',
  styleUrls: ['./user-component.component.scss']
})
export class UserComponentComponent implements OnInit {
  // Datos del estudiante
  userData: StudentData | null = null;
  matricula: string = '';
  
  // Registro de vehículos
  activeVehicleRecords: VehicleRecord[] = [];
  historicalRecords: VehicleRecord[] = [];
  userVehicleInfo: UserVehicleInfo | null = null;
  
  // Columnas para la tabla de registros activos
  activeRecordsColumns: string[] = ['licensePlate', 'entryTime', 'actions'];
  
  // Columnas para la tabla de registros históricos
  historicalRecordsColumns: string[] = ['licensePlate', 'date', 'entryTime', 'exitTime', 'duration'];
  
  // Formulario para nuevo vehículo
  newLicensePlate: string = '';
  selectedLicensePlate: string = '';
  
  // Estado de la interfaz
  loading: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit() {
    // Obtener la matrícula del usuario de la URL
    this.route.paramMap.subscribe(params => {
      const matricula = params.get('matricula');
      if (!matricula) {
        this.router.navigate(['/home']);
        return;
      }
      
      this.matricula = matricula;
      
      // Verificar si estamos en el navegador antes de acceder a window
      const isBrowser = isPlatformBrowser(this.platformId);
      
      if (isBrowser) {
        // Si estamos en el navegador, intentar obtener datos del state
        const navigationState = window.history.state;
        
        if (navigationState && navigationState.userData) {
          this.userData = navigationState.userData;
          console.log('Datos del usuario cargados desde state:', this.userData);
        } else {
          this.setDefaultUserData();
        }
      } else {
        // Si estamos en el servidor, usar datos por defecto
        this.setDefaultUserData();
      }
      
      // Cargar datos de vehículos del usuario
      this.loadVehicleData();
    });
  }
  
  /**
   * Establece datos de usuario por defecto cuando no hay datos disponibles
   */
  private setDefaultUserData() {
    console.log('No se encontraron datos en state, usando datos básicos');
    this.userData = {
      Matricula: this.matricula,
      'Apellido Paterno': 'Apellido',
      'Apellido Materno': 'Materno',
      Nombre: 'Nombre',
      Email: `${this.matricula}@ejemplo.com`
    };
  }
  
  /**
   * Carga los datos de vehículos del usuario
   */
  loadVehicleData() {
    this.loading = true;
    
    // Verificar si estamos en el navegador
    const isBrowser = isPlatformBrowser(this.platformId);
    
    if (!isBrowser) {
      // Si estamos en el servidor, establecer datos por defecto y terminar
      this.activeVehicleRecords = [];
      this.historicalRecords = [];
      this.userVehicleInfo = { licensePlates: [] };
      this.loading = false;
      return;
    }
    
    try {
      // Solo ejecutar estas operaciones en el navegador
      // Cargar registros activos (vehículos dentro del campus)
      this.activeVehicleRecords = this.vehicleService.getActiveUserVehicleRecords(this.matricula);
      
      // Cargar registros históricos
      this.historicalRecords = this.vehicleService.getHistoricalUserVehicleRecords(this.matricula);
      
      // Cargar información de vehículos del usuario
      this.userVehicleInfo = this.vehicleService.getUserVehicleInfo(this.matricula);
    } catch (error) {
      this.showError('Error al cargar los datos de vehículos');
      console.error('Error loading vehicle data:', error);
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Registra un nuevo vehículo para el usuario
   */
  registerNewVehicle() {
    if (!this.newLicensePlate.trim()) {
      this.showError('Por favor ingrese una placa válida');
      return;
    }
    
    try {
      this.vehicleService.associateLicensePlateWithUser(this.matricula, this.newLicensePlate.toUpperCase());
      this.showSuccess('Vehículo registrado correctamente');
      this.newLicensePlate = '';
      this.loadVehicleData(); // Recargar datos
    } catch (error) {
      this.showError('Error al registrar el vehículo');
      console.error('Error registering vehicle:', error);
    }
  }
  
  /**
   * Elimina un vehículo registrado del usuario
   */
  removeVehicle(licensePlate: string) {
    try {
      this.vehicleService.removeLicensePlateFromUser(this.matricula, licensePlate);
      this.showSuccess('Vehículo eliminado correctamente');
      this.loadVehicleData(); // Recargar datos
    } catch (error) {
      this.showError('Error al eliminar el vehículo');
      console.error('Error removing vehicle:', error);
    }
  }
  
  /**
   * Registra la entrada de un vehículo
   */
  registerVehicleEntry() {
    if (!this.selectedLicensePlate) {
      this.showError('Por favor seleccione una placa');
      return;
    }
    
    try {
      this.vehicleService.registerEntry(this.matricula, this.selectedLicensePlate);
      this.showSuccess('Entrada registrada correctamente');
      this.selectedLicensePlate = '';
      this.loadVehicleData(); // Recargar datos
    } catch (error: any) {
      this.showError(error.message || 'Error al registrar la entrada');
      console.error('Error registering entry:', error);
    }
  }
  
  /**
   * Registra la salida de un vehículo
   */
  registerVehicleExit(recordId: string) {
    try {
      this.vehicleService.registerExit(recordId);
      this.showSuccess('Salida registrada correctamente');
      this.loadVehicleData(); // Recargar datos
    } catch (error: any) {
      this.showError(error.message || 'Error al registrar la salida');
      console.error('Error registering exit:', error);
    }
  }
  
  /**
   * Formatea una fecha ISO a un formato más amigable
   */
  formatDateTime(dateTimeStr: string): string {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('es-MX');
    } catch (error) {
      return 'Fecha inválida';
    }
  }
  
  /**
   * Calcula la duración entre entrada y salida
   */
  calculateDuration(entryTime: string, exitTime?: string): string {
    if (!exitTime) return 'En curso';
    
    const entry = new Date(entryTime).getTime();
    const exit = new Date(exitTime).getTime();
    const diffMs = exit - entry;
    
    // Calcular horas y minutos
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
  
  /**
   * Vuelve a la página de inicio
   */
  goBack() {
    this.router.navigate(['/home']);
  }
  
  /**
   * Muestra un mensaje de éxito
   */
  private showSuccess(message: string) {
    // Verificar si estamos en el navegador antes de mostrar el snackbar
    if (isPlatformBrowser(this.platformId)) {
      this.snackBar.open(message, 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    } else {
      console.log(message);
    }
  }
  
  /**
   * Muestra un mensaje de error
   */
  private showError(message: string) {
    // Verificar si estamos en el navegador antes de mostrar el snackbar
    if (isPlatformBrowser(this.platformId)) {
      this.snackBar.open(message, 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    } else {
      console.error(message);
    }
  }
}