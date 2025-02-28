import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

interface StudentMetadata {
  total: number;
  chunks: number;
  chunkSize: number;
  fields: string[];
}

export interface StudentData {
  Matricula: string;
  'Apellido Paterno': string;
  'Apellido Materno': string;
  Nombre: string;
  Email: string;
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private dbName = 'students-db';
  private dbVersion = 1;
  private metadata: StudentMetadata | null = null;
  private db: IDBDatabase | null = null;
  private loadedChunks: Set<number> = new Set();
  private isBrowser: boolean;
  // Offset para ajustar la numeración de los archivos (comenzando desde 1 en lugar de 0)
  private chunkOffset = 1;
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initDatabase();
    }
  }

  /**
   * Inicializa la base de datos IndexedDB
   */
  private initDatabase(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      if (!this.isBrowser) {
        reject(new Error('IndexedDB no está disponible en el servidor'));
        return;
      }
      
      if (this.db) {
        resolve(this.db);
        return;
      }
      
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = (event: any) => {
          console.error('Error abriendo base de datos', event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = (event: any) => {
          this.db = event.target.result;
          if (this.db) {
            resolve(this.db);
          } else {
            reject(new Error('No se pudo abrir la base de datos IndexedDB'));
          }
        };
        
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          
          // Almacén para metadata
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'id' });
          }
          
          // Almacén para chunks de datos
          if (!db.objectStoreNames.contains('students')) {
            db.createObjectStore('students', { keyPath: 'chunkId' });
          }
        };
      } catch (error) {
        console.error('Error al inicializar IndexedDB:', error);
        reject(error);
      }
    });
  }

  /**
   * Obtiene la metadata de los estudiantes
   */
  getMetadata(): Observable<StudentMetadata> {
    if (!this.isBrowser) {
      // En SSR, intentamos obtener la metadata del servidor sin utilizar datos de prueba
      return this.fetchMetadataFromServer();
    }

    if (this.metadata) {
      return of(this.metadata);
    }

    return from(this.initDatabase().catch(() => null)).pipe(
      switchMap(() => this.getMetadataFromIndexedDB().catch(() => null)),
      switchMap(metadata => {
        if (metadata) {
          this.metadata = metadata;
          return of(metadata);
        } else {
          return this.fetchMetadataFromServer();
        }
      })
    );
  }

  /**
   * Obtiene estudiantes paginados
   */
  getStudents(page: number, pageSize: number): Observable<StudentData[]> {
    if (!this.isBrowser) {
      // En SSR, retornamos una matriz vacía; los datos se cargarán en el cliente
      return of([]);
    }

    return this.getMetadata().pipe(
      switchMap(metadata => {
        // Calcular qué chunks necesitamos
        const startIndex = page * pageSize;
        const endIndex = Math.min(startIndex + pageSize, metadata.total);
        
        const startChunk = Math.floor(startIndex / metadata.chunkSize);
        const endChunk = Math.floor((endIndex - 1) / metadata.chunkSize);
        
        // Cargar todos los chunks necesarios - ajustados con el offset
        const chunksToLoad: Promise<void>[] = [];
        for (let i = startChunk; i <= endChunk; i++) {
          // Aplicar offset para cargar desde students-data-1.json
          const adjustedChunkId = i + this.chunkOffset;
          if (!this.loadedChunks.has(adjustedChunkId)) {
            chunksToLoad.push(this.loadChunk(adjustedChunkId));
          }
        }
        
        if (chunksToLoad.length > 0) {
          return from(Promise.all(chunksToLoad)).pipe(
            switchMap(() => this.getStudentRange(startIndex, endIndex))
          );
        } else {
          return this.getStudentRange(startIndex, endIndex);
        }
      }),
      catchError(error => {
        console.error('Error obteniendo estudiantes:', error);
        // Retornamos un array vacío en caso de error, en lugar de datos de prueba
        return of([]);
      })
    );
  }

  /**
   * Obtiene un rango de estudiantes desde IndexedDB
   */
  private getStudentRange(startIndex: number, endIndex: number): Observable<StudentData[]> {
    if (!this.isBrowser || !this.metadata) {
      return of([]);
    }
    
    return from(this.initDatabase()).pipe(
      switchMap(() => {
        const chunksNeeded = new Set<number>();
        for (let i = startIndex; i < endIndex; i++) {
          const chunkId = Math.floor(i / this.metadata!.chunkSize) + this.chunkOffset;
          chunksNeeded.add(chunkId);
        }
        
        // Obtener todos los chunks necesarios
        const getChunksPromises = Array.from(chunksNeeded).map(chunkId => this.getChunkFromIndexedDB(chunkId));
        
        return from(Promise.all(getChunksPromises)).pipe(
          map(chunks => {
            // Combinar todos los chunks y extraer el rango solicitado
            const allStudents = chunks.reduce((acc: StudentData[], chunk: any) => {
              return acc.concat(chunk.data);
            }, []);
            
            // Calcular las posiciones relativas dentro de los chunks combinados
            const relativeStart = startIndex % this.metadata!.chunkSize;
            return allStudents.slice(relativeStart, relativeStart + (endIndex - startIndex));
          })
        );
      }),
      catchError(error => {
        console.error('Error obteniendo rango de estudiantes:', error);
        return of([]);
      })
    );
  }

  /**
   * Carga un chunk desde el servidor
   */
  private loadChunk(chunkId: number): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // Usamos el chunkId directamente ya que ya tiene aplicado el offset
      this.http.get<StudentData[]>(`assets/students-data-${chunkId}.json`)
        .pipe(
          catchError(error => {
            console.error(`Error cargando chunk ${chunkId}:`, error);
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (data) => {
            this.storeChunkInIndexedDB(chunkId, data)
              .then(() => {
                this.loadedChunks.add(chunkId);
                resolve();
              })
              .catch(reject);
          },
          error: reject
        });
    });
  }

  // ...resto de métodos relacionados con IndexedDB, todos deben comprobar this.isBrowser...

  /**
   * Almacena un chunk en IndexedDB
   */
  private storeChunkInIndexedDB(chunkId: number, data: StudentData[]): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }
      
      const transaction = this.db.transaction(['students'], 'readwrite');
      const store = transaction.objectStore('students');
      
      const request = store.put({ chunkId, data });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error almacenando chunk en IndexedDB:', event);
        reject(new Error('Error almacenando chunk'));
      };
    });
  }

  /**
   * Obtiene un chunk desde IndexedDB
   */
  private getChunkFromIndexedDB(chunkId: number): Promise<{ chunkId: number, data: StudentData[] }> {
    if (!this.isBrowser) {
      return Promise.resolve({ chunkId, data: [] });
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }
      
      const transaction = this.db.transaction(['students'], 'readonly');
      const store = transaction.objectStore('students');
      
      const request = store.get(chunkId);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Si no existe en IndexedDB, cargarlo desde el servidor
          this.loadChunk(chunkId)
            .then(() => this.getChunkFromIndexedDB(chunkId))
            .then(resolve)
            .catch(reject);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error obteniendo chunk desde IndexedDB:', event);
        reject(new Error('Error obteniendo chunk'));
      };
    });
  }

  /**
   * Obtiene metadata desde IndexedDB
   */
  private getMetadataFromIndexedDB(): Promise<StudentMetadata | null> {
    if (!this.isBrowser) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }
      
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      
      const request = store.get('students');
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };
      
      request.onerror = (event) => {
        console.error('Error obteniendo metadata desde IndexedDB:', event);
        reject(new Error('Error obteniendo metadata'));
      };
    });
  }

  /**
   * Almacena metadata en IndexedDB
   */
  private storeMetadataInIndexedDB(metadata: StudentMetadata): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }
      
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      
      const request = store.put({ id: 'students', data: metadata });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error almacenando metadata en IndexedDB:', event);
        reject(new Error('Error almacenando metadata'));
      };
    });
  }

  /**
   * Obtiene metadata desde el servidor
   */
  private fetchMetadataFromServer(): Observable<StudentMetadata> {
    return this.http.get<StudentMetadata>('assets/students-metadata.json').pipe(
      tap(metadata => {
        // Almacenar la metadata sin ajustar el total
        const adjustedMetadata = {
          ...metadata
          // Ya no restamos metadata.chunkSize del total
        };
        
        this.metadata = adjustedMetadata;
        
        if (this.isBrowser) {
          this.storeMetadataInIndexedDB(adjustedMetadata).catch(err => {
            console.error('Error guardando metadata en IndexedDB:', err);
          });
        }
      }),
      catchError(error => {
        console.error('Error cargando metadata:', error);
        // En caso de error, retornar un objeto de metadata vacío/mínimo
        return of({
          total: 0,
          chunks: 0,
          chunkSize: 100,
          fields: ['Matricula', 'Apellido Paterno', 'Apellido Materno', 'Nombre', 'Email']
        });
      })
    );
  }

  /**
   * Busca estudiantes por texto
   */
  searchStudents(searchTerm: string): Observable<StudentData[]> {
    if (!this.isBrowser) {
      return of([]);
    }

    if (!searchTerm || searchTerm.trim() === '') {
      return of([]);
    }

    // Normalizar término de búsqueda (quitar acentos, convertir a minúsculas)
    const normalizedTerm = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return this.getMetadata().pipe(
      switchMap(metadata => {
        // Cargar todos los chunks si es necesario - con el offset aplicado
        const chunksToLoad: Promise<void>[] = [];
        for (let i = 0; i < metadata.chunks; i++) {
          const adjustedChunkId = i + this.chunkOffset;
          if (!this.loadedChunks.has(adjustedChunkId)) {
            chunksToLoad.push(this.loadChunk(adjustedChunkId));
          }
        }
        
        return from(Promise.all(chunksToLoad)).pipe(
          switchMap(() => this.searchInIndexedDB(normalizedTerm))
        );
      }),
      catchError(error => {
        console.error('Error en la búsqueda:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca en IndexedDB
   */
  private searchInIndexedDB(term: string): Observable<StudentData[]> {
    if (!this.isBrowser) {
      return of([]);
    }

    return from(this.initDatabase()).pipe(
      switchMap(() => {
        return new Promise<StudentData[]>((resolve, reject) => {
          if (!this.db || !this.metadata) {
            reject(new Error('Base de datos no inicializada o metadata no disponible'));
            return;
          }
          
          const results: StudentData[] = [];
          const transaction = this.db.transaction(['students'], 'readonly');
          const store = transaction.objectStore('students');
          
          const request = store.openCursor();
          request.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
              const chunkData = cursor.value.data;
              
              // Filtrar estudiantes que coincidan con el término de búsqueda
              const matchingStudents = chunkData.filter((student: StudentData) => {
                return Object.values(student).some(value => {
                  const normalizedValue = String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return normalizedValue.includes(term);
                });
              });
              
              results.push(...matchingStudents);
              cursor.continue();
            } else {
              resolve(results);
            }
          };
          
          request.onerror = (event) => {
            console.error('Error buscando en IndexedDB:', event);
            reject(new Error('Error buscando estudiantes'));
          };
        });
      }),
      catchError(error => {
        console.error('Error buscando en IndexedDB:', error);
        return of([]);
      })
    );
  }

  /**
   * Limpia la caché de IndexedDB
   */
  clearCache(): Observable<void> {
    if (!this.isBrowser) {
      return of(undefined);
    }

    return from(this.initDatabase()).pipe(
      switchMap(() => {
        return new Promise<void>((resolve, reject) => {
          if (!this.db) {
            reject(new Error('Base de datos no inicializada'));
            return;
          }
          
          const transaction = this.db.transaction(['students', 'metadata'], 'readwrite');
          const studentsStore = transaction.objectStore('students');
          const metadataStore = transaction.objectStore('metadata');
          
          studentsStore.clear();
          metadataStore.clear();
          
          transaction.oncomplete = () => {
            this.loadedChunks.clear();
            this.metadata = null;
            resolve();
          };
          
          transaction.onerror = (event) => {
            console.error('Error limpiando caché:', event);
            reject(new Error('Error limpiando caché'));
          };
        });
      }),
      catchError(error => {
        console.error('Error limpiando caché:', error);
        return of(undefined);
      })
    );
  }
}