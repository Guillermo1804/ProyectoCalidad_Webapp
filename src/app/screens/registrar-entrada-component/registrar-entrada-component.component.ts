import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  language: string;
}

@Component({
  selector: 'app-registrar-entrada-component',
  imports: [FormsModule, CommonModule, MatTableModule],
  templateUrl: './registrar-entrada-component.component.html',
  styleUrl: './registrar-entrada-component.component.scss'
})
export class RegistrarEntradaComponentComponent implements OnInit{
  displayedColumns: string[] = ['id', 'name', 'email', 'age', 'language', 'options'];
  dataSource!: MatTableDataSource<User>; // Usa el operador "!" si inicializas en ngOnInit

  ngOnInit() {
    const users: User[] = [
      {id: 1, name: 'Gonzalo', email: 'gonzalo@mail.com', age: 31, language: 'esp'},
      {id: 2, name: 'Roser', email: 'roser@mail.com', age: 30, language: 'eng'}
    ];
    this.dataSource = new MatTableDataSource(users); // Inicialización correcta
  }

  onUpdate() {

  }

  onDelete() {

  }
}
