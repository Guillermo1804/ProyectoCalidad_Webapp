import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FacadeServiceService, VehicleMovementRecord, ActiveVehicle } from '../../services/facade.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe, 
    MatProgressSpinnerModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loadingHistory: boolean = true;
  loadingVehicles: boolean = true;
  movementHistory: VehicleMovementRecord[] = [];
  vehiclesInCampus: ActiveVehicle[] = [];
  userId: string | null = null;
  errorMessage: string | null = null;

  constructor(private facadeService: FacadeServiceService) { }

  ngOnInit(): void {
    this.userId = this.facadeService.getUserIdCookie();
    if (this.userId) {
      this.loadUserMovementHistory();
      this.loadUserVehiclesInCampus();
    } else {
      this.errorMessage = 'No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.';
      this.loadingHistory = false;
      this.loadingVehicles = false;
    }
  }

  loadUserMovementHistory(): void {
    if (!this.userId) return;
    this.loadingHistory = true;
    this.facadeService.getUserMovementHistory(this.userId).subscribe({
      next: (data) => {
        this.movementHistory = data;
        this.loadingHistory = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar el historial de movimientos.';
        console.error(err);
        this.loadingHistory = false;
      }
    });
  }

  loadUserVehiclesInCampus(): void {
    if (!this.userId) return;
    this.loadingVehicles = true;
    this.facadeService.getUserActiveVehicles(this.userId).subscribe({
      next: (data) => {
        this.vehiclesInCampus = data;
        this.loadingVehicles = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar los vehículos en campus.';
        console.error(err);
        this.loadingVehicles = false;
      }
    });
  }

  calculateDuration(entry: Date, exit?: Date): string {
    if (!exit) return 'En campus';
    const durationMs = new Date(exit).getTime() - new Date(entry).getTime();
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
}
