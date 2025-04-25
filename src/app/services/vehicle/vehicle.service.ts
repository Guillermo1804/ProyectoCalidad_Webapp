import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError } from 'rxjs';
import { StudentData } from '../database.service';

export interface VehicleRecord {
  id: string;
  matricula: string;
  license_plate: string;
  entry_time: string;
  exit_time?: string;
  date: string;
}

export interface UserVehicleInfo {
  license_plates: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly VEHICLE_RECORDS_KEY = 'vehicle_records';
  private readonly USER_VEHICLE_INFO_KEY = 'user_vehicle_info';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  registerEntry(matricula: string, licensePlate: string): Observable<VehicleRecord> {
    try {
      const records = this.getVehicleRecords();
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];

      const activeRecord = records.find(record =>
        record.license_plate === licensePlate &&
        !record.exit_time &&
        record.date === currentDate
      );

      if (activeRecord) {
        return throwError(() => new Error('Ya existe un registro de entrada activo para esta placa'));
      }

      const newRecord: VehicleRecord = {
        id: this.generateId(),
        matricula,
        license_plate: licensePlate,
        entry_time: now.toISOString(),
        date: currentDate
      };

      records.push(newRecord);
      this.saveVehicleRecords(records);
      this.associateLicensePlateWithUser(matricula, licensePlate);

      return of(newRecord);
    } catch (error) {
      return throwError(() => error);
    }
  }

  registerExit(recordId: string): Observable<VehicleRecord> {
    try {
      const records = this.getVehicleRecords();
      const recordIndex = records.findIndex(r => r.id === recordId);

      if (recordIndex === -1) {
        return throwError(() => new Error('Registro no encontrado'));
      }

      if (records[recordIndex].exit_time) {
        return throwError(() => new Error('Este vehículo ya tiene registrada su salida'));
      }

      records[recordIndex].exit_time = new Date().toISOString();
      this.saveVehicleRecords(records);

      return of(records[recordIndex]);
    } catch (error) {
      return throwError(() => error);
    }
  }

  getActiveUserVehicleRecords(matricula: string): Observable<VehicleRecord[]> {
    const userRecords = this.getUserVehicleRecords(matricula);
    const currentDate = new Date().toISOString().split('T')[0];

    const activeRecords = userRecords.filter(record =>
      !record.exit_time && record.date === currentDate
    );

    return of(activeRecords);
  }

  getHistoricalUserVehicleRecords(matricula: string): Observable<VehicleRecord[]> {
    const userRecords = this.getUserVehicleRecords(matricula);
    const historicalRecords = userRecords.filter(record => record.exit_time !== undefined);
    return of(historicalRecords);
  }

  getUserVehicleInfo(matricula: string): Observable<UserVehicleInfo> {
    const userVehicleInfo = this.getAllUserVehicleInfo();
    if (!userVehicleInfo[matricula]) {
      userVehicleInfo[matricula] = { license_plates: [] };
    }
    return of(userVehicleInfo[matricula]);
  }

  associateLicensePlateWithUser(matricula: string, licensePlate: string): Observable<void> {
    try {
      const userVehicleInfo = this.getAllUserVehicleInfo();

      if (!userVehicleInfo[matricula]) {
        userVehicleInfo[matricula] = { license_plates: [] };
      }

      if (!userVehicleInfo[matricula].license_plates.includes(licensePlate)) {
        userVehicleInfo[matricula].license_plates.push(licensePlate);
        this.saveAllUserVehicleInfo(userVehicleInfo);
      }
      return of(undefined);
    } catch (error) {
      return throwError(() => error);
    }
  }

  removeLicensePlateFromUser(matricula: string, licensePlate: string): Observable<void> {
    try {
      const userVehicleInfo = this.getAllUserVehicleInfo();

      if (userVehicleInfo[matricula]?.license_plates) {
        const index = userVehicleInfo[matricula].license_plates.indexOf(licensePlate);
        if (index > -1) {
          userVehicleInfo[matricula].license_plates.splice(index, 1);
          this.saveAllUserVehicleInfo(userVehicleInfo);
        }
      }
      return of(undefined);
    } catch (error) {
      return throwError(() => error);
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }

  private getVehicleRecords(): VehicleRecord[] {
    if (!this.isBrowser) return [];
    const recordsStr = localStorage.getItem(this.VEHICLE_RECORDS_KEY);
    return recordsStr ? JSON.parse(recordsStr) : [];
  }

  private saveVehicleRecords(records: VehicleRecord[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.VEHICLE_RECORDS_KEY, JSON.stringify(records));
  }

  private getUserVehicleRecords(matricula: string): VehicleRecord[] {
    const allRecords = this.getVehicleRecords();
    return allRecords.filter(record => record.matricula === matricula);
  }

  private getAllUserVehicleInfo(): Record<string, UserVehicleInfo> {
    if (!this.isBrowser) return {};
    const infoStr = localStorage.getItem(this.USER_VEHICLE_INFO_KEY);
    return infoStr ? JSON.parse(infoStr) : {};
  }

  private saveAllUserVehicleInfo(info: Record<string, UserVehicleInfo>): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.USER_VEHICLE_INFO_KEY, JSON.stringify(info));
  }
}
