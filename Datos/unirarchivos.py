import pandas as pd
import glob

# Busca todos los archivos CSV en la carpeta actual
archivos_csv = glob.glob("*.csv")

# Carga y combina los archivos en un solo DataFrame
df_combinado = pd.concat([pd.read_csv(f) for f in archivos_csv], ignore_index=True)

# Guarda el resultado en un nuevo archivo CSV
df_combinado.to_csv("archivo_final.csv", index=False)

print("Archivos combinados exitosamente en 'archivo_final.csv'")
