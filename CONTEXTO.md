# PROYECTO: MIVIDEOAI (Reglas de Negocio)

1. Estado de los Activos (La Verdad Absoluta)
Para Vender: Usamos SIEMPRE la columna is_for_sale (BOOLEAN).

Nota: Ignorar columna for_sale si existe.

Vendido: Usamos SIEMPRE la columna is_sold (BOOLEAN).

Nota: La columna sold NO EXISTE en la base de datos.

2. Reglas de Seguridad (Backend)
Zombis: Si un video original (generation) tiene is_sold: true o is_for_sale: true, NADIE puede crear nuevos modelos a partir de él.

Marketplace: Solo mostrar items donde is_for_sale: true Y el video padre NO esté vendido.

3. Base de Datos
Frontend: React/Vite.

Backend: Node.js.

DB: Supabase.
