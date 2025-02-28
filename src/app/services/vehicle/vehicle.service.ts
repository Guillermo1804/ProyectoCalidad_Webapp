import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StudentData } from '../database.service';

export interface VehicleRecord {
  id: string;
  matricula: string;
  licensePlate: string;
  entryTime: string;
  exitTime?: string;
  date: string;
}

export interface UserVehicleInfo {
  licensePlates: string[]; // Placas registradas por el usuario
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

  /**
   * Registra la entrada de un vehículo
   */
  registerEntry(matricula: string, licensePlate: string): VehicleRecord {
    const records = this.getVehicleRecords();
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // Verificar si ya existe un registro activo para esta placa
    const activeRecord = records.find(record => 
      record.licensePlate === licensePlate && 
      !record.exitTime &&
      record.date === currentDate
    );

    if (activeRecord) {
      throw new Error('Ya existe un registro de entrada activo para esta placa');
    }

    // Crear nuevo registro
    const newRecord: VehicleRecord = {
      id: this.generateId(),
      matricula,
      licensePlate,
      entryTime: now.toISOString(),
      date: currentDate
    };

    // Guardar el registro
    records.push(newRecord);
    this.saveVehicleRecords(records);
    
    // Asociar la placa con el usuario si no está registrada
    this.associateLicensePlateWithUser(matricula, licensePlate);
    
    return newRecord;
  }

  /**
   * Registra la salida de un vehículo
   */
  registerExit(recordId: string): VehicleRecord {
    const records = this.getVehicleRecords();
    const recordIndex = records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      throw new Error('Registro no encontrado');
    }
    
    if (records[recordIndex].exitTime) {
      throw new Error('Este vehículo ya tiene registrada su salida');
    }
    
    // Actualizar el registro con la hora de salida
    records[recordIndex].exitTime = new Date().toISOString();
    this.saveVehicleRecords(records);
    
    return records[recordIndex];
  }

  /**
   * Obtiene los registros de vehículos de un usuario específico
   */
  getUserVehicleRecords(matricula: string): VehicleRecord[] {
    const allRecords = this.getVehicleRecords();
    return allRecords.filter(record => record.matricula === matricula);
  }

  /**
   * Obtiene los registros activos (sin salida) de vehículos de un usuario
   */
  getActiveUserVehicleRecords(matricula: string): VehicleRecord[] {
    const userRecords = this.getUserVehicleRecords(matricula);
    const currentDate = new Date().toISOString().split('T')[0];
    
    return userRecords.filter(record => 
      !record.exitTime && record.date === currentDate
    );
  }

  /**
   * Obtiene los registros históricos de vehículos de un usuario
   */
  getHistoricalUserVehicleRecords(matricula: string): VehicleRecord[] {
    const userRecords = this.getUserVehicleRecords(matricula);
    return userRecords.filter(record => record.exitTime !== undefined);
  }

  /**
   * Obtiene la información de vehículos de un usuario
   */
  getUserVehicleInfo(matricula: string): UserVehicleInfo {
    const userVehicleInfo = this.getAllUserVehicleInfo();
    if (!userVehicleInfo[matricula]) {
      userVehicleInfo[matricula] = { licensePlates: [] };
    }
    return userVehicleInfo[matricula];
  }

  /**
   * Asocia una placa con un usuario
   */
  associateLicensePlateWithUser(matricula: string, licensePlate: string): void {
    const userVehicleInfo = this.getAllUserVehicleInfo();
    
    if (!userVehicleInfo[matricula]) {
      userVehicleInfo[matricula] = { licensePlates: [] };
    }
    
    if (!userVehicleInfo[matricula].licensePlates.includes(licensePlate)) {
      userVehicleInfo[matricula].licensePlates.push(licensePlate);
      this.saveAllUserVehicleInfo(userVehicleInfo);
    }
  }

  /**
   * Elimina una placa asociada a un usuario
   */
  removeLicensePlateFromUser(matricula: string, licensePlate: string): void {
    const userVehicleInfo = this.getAllUserVehicleInfo();
    
    if (userVehicleInfo[matricula] && userVehicleInfo[matricula].licensePlates) {
      const index = userVehicleInfo[matricula].licensePlates.indexOf(licensePlate);
      if (index > -1) {
        userVehicleInfo[matricula].licensePlates.splice(index, 1);
        this.saveAllUserVehicleInfo(userVehicleInfo);
      }
    }
  }

  /**
   * Genera un ID único para un registro
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Obtiene todos los registros de vehículos almacenados
   */
  private getVehicleRecords(): VehicleRecord[] {
    if (!this.isBrowser) {
      return [];
    }
    const recordsStr = localStorage.getItem(this.VEHICLE_RECORDS_KEY);
    return recordsStr ? JSON.parse(recordsStr) : [];
  }

  /**
   * Guarda todos los registros de vehículos
   */
  private saveVehicleRecords(records: VehicleRecord[]): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(this.VEHICLE_RECORDS_KEY, JSON.stringify(records));
  }

  /**
   * Obtiene la información de vehículos de todos los usuarios
   */
  private getAllUserVehicleInfo(): Record<string, UserVehicleInfo> {
    if (!this.isBrowser) {
      return {};
    }
    const infoStr = localStorage.getItem(this.USER_VEHICLE_INFO_KEY);
    return infoStr ? JSON.parse(infoStr) : {};
  }

  /**
   * Guarda la información de vehículos de todos los usuarios
   */
  private saveAllUserVehicleInfo(info: Record<string, UserVehicleInfo>): void {
    if (!this.isBrowser) {
      return;
    }
    localStorage.setItem(this.USER_VEHICLE_INFO_KEY, JSON.stringify(info));
  }
}