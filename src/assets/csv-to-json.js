// Script para convertir CSV a JSON para carga más rápida
const fs = require('fs');
const path = require('path');
const papa = require('papaparse');

// Rutas de archivos
const inputFile = path.join(__dirname, 'archivo_final.csv');
const outputFile = path.join(__dirname, 'students-data.json');

// Leer archivo CSV
console.log(`Leyendo archivo CSV desde: ${inputFile}`);
const csvData = fs.readFileSync(inputFile, 'utf8');

// Parsear CSV
papa.parse(csvData, {
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    console.log(`Se encontraron ${results.data.length} registros`);
    
    // Dividir los datos en chunks de 100 para carga más eficiente
    const chunks = [];
    const chunkSize = 100;
    
    for (let i = 0; i < results.data.length; i += chunkSize) {
      chunks.push(results.data.slice(i, i + chunkSize));
    }
    
    console.log(`Dividido en ${chunks.length} chunks de aproximadamente ${chunkSize} registros cada uno`);
    
    // Crear metadata
    const metadata = {
      total: results.data.length,
      chunks: chunks.length,
      chunkSize: chunkSize,
      fields: Object.keys(results.data[0] || {})
    };
    
    // Escribir metadata a un archivo
    fs.writeFileSync(
      path.join(__dirname, 'students-metadata.json'), 
      JSON.stringify(metadata, null, 2)
    );
    console.log(`Metadata guardada en: students-metadata.json`);
    
    // Escribir cada chunk a un archivo separado
    chunks.forEach((chunk, index) => {
      const chunkFile = path.join(__dirname, `students-data-${index}.json`);
      fs.writeFileSync(chunkFile, JSON.stringify(chunk));
      console.log(`Chunk ${index + 1}/${chunks.length} guardado en: students-data-${index}.json`);
    });

    console.log('Conversión completada exitosamente');
  },
  error: function(error) {
    console.error('Error al parsear CSV:', error.message);
  }
});