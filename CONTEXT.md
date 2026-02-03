# MivideoAI - Project Context & Business Rules

## 1. Core Identity

- **Product:** MivideoAI (Marketplace de Influencers IA).
- **Value Prop:** Plataforma unificada para crear, comprar, vender y monetizar influencers generados por IA.
- **Target Audience:** Creadores de contenido, Agencias de Marketing, Marcas.

## 2. Key Modules (Critical Logic)

El sistema se compone de los siguientes módulos críticos. Cualquier refactorización debe preservar su integridad:

- **Marketplace:** El núcleo transaccional. Permite la compra/venta de personajes digitales (Assets).
- **Studio de Creación:** Herramientas para generar contenido de video/imagen de los influencers.
- **Modo Casting:** Algoritmos de match entre marcas e influencers según estilo y KPI.
- **Modo Velvet (+18):** Generación de contenido adulto. **REGLA CRÍTICA:** Debe ser privado, controlado y automatizado. La seguridad y privacidad en este módulo es prioridad máxima.
- **Galería/Ranking:** Sistema de valoración de los influencers más exitosos.

## 3. Business Goals (2026 Roadmap)

- **Prioridad Actual (Q1-Q2):** Validación de monetización y activación de primeros creadores.
- **Infraestructura:** El sistema debe escalar para soportar la generación de video mejorada y la expansión de usuarios.

## 4. Branding & UI Guidelines

- **Estética:** Profesional pero accesible.
- **Assets Clave:** Logo, bio, y estética visual definida para redes y web.

## 5. Development Rules for AI Agents

1. **Monetización:** Nunca alterar la lógica que calcula créditos o pagos en el Marketplace.
2. **Privacidad:** El contenido generado en "Modo Velvet" nunca debe ser accesible públicamente sin autenticación estricta.
3. **Performance:** La generación de video es costosa; optimizar cualquier código relacionado con llamadas a APIs de generación.

## 6. Development Log & Critical Updates

### [2026-01-30 01:20] Update: Diagnóstico de Errores y Seguridad

1.  **Diagnóstico de Error (Replicate):**
    - Los errores 500 en generación son **errores 429 (Rate Limit)** disfrazados.
    - **Causa Raíz:** Saldo en cuenta < $5 USD impone un límite estricto de **'Burst of 1'** (solo 1 petición simultánea permitida).

2.  **Validación Backend:**
    - El sistema de protección de créditos (Atomic Credits) funciona correctamente.
    - Si la API falla (incluso por Rate Limit), se ejecuta un **reembolso automático (Refund successful)**, protegiendo el saldo del usuario.

3.  **Incidente de Seguridad [URGENTE]:**
    - La API Key de Replicate fue expuesta en logs durante el debugging.
    - **ACCIÓN PENDIENTE:** Rotar la API Key en `.env` local y en las variables de entorno de Vercel inmediatamente.

4.  **Corrección de UX (Implementado):**
    - El frontend bloquea el botón 'Generar' **inmediatamente** al hacer clic (estado `PROCESSING`).
    - Esto actúa como un _debounce_ manual para prevenir múltiples peticiones accidentales que chocarían con el límite de tasa estricto.

---

## 📅 Actualización Crítica: Migración a Motores de Reconstrucción (31/01/2026)

### 1. Cambio de Arquitectura (Flux Reconstruction)

Se abandonó el enfoque de "Composición Simple + Maquillaje SDXL" por falta de realismo físico.

- **Nuevo Motor:** `fal-ai/flux/dev/image-to-image`.
- **Objetivo:** Inpainting generativo. Flux recibe el collage y "alucina" dedos y agarres físicos reales sobre el objeto flotante.
- **Configuración Actual:** Strength 0.45, Guidance 3.5, Steps 25.

### 2. Bitácora de Bugs y Soluciones (Post-Deployment)

| Incidente               | Causa                                                         | Solución Definitiva                                                                     |
| :---------------------- | :------------------------------------------------------------ | :-------------------------------------------------------------------------------------- |
| **Fal.ai 404**          | ID de modelo incompleto (`bria-rmbg`).                        | Se estandarizó a namespaces completos: `fal-ai/birefnet` y `fal-ai/flux/...`.           |
| **Video Ratio Erróneo** | Backend ignoraba `aspectRatio` del frontend.                  | Se inyectó dinámicamente `aspect_ratio` en el payload de Kling.                         |
| **Objeto "Fantasma"**   | Kling borraba el producto por parecer un sticker.             | **Solución:** Migración a FLUX para generar integración física (manos) antes del video. |
| **Posición Errónea**    | "Neck level" era antinatural; "Bottom-right" era irrelevante. | **Estándar:** "Universal Fit" (Centro Horizontal, ~55% Altura / Plexo Solar).           |

### 3. Nuevas Reglas de Implementación

- **Identidad:** Prohibido usar modelos que no sean img2img sobre el collage original.
- **Refunds:** Fallback manual SQL implementado en caso de fallo RPC.
- **Prompting:** No forzar acciones complejas en el prompt visual; dejar que Kling anime la acción desde una pose neutra de "holding".

---

## 📅 Actualización Crítica: Migración a Kling Elements (03/02/2026)

### 1. Cambio de Arquitectura (Enterprise Multi-Image)

Se abandonó el pipeline de 4 pasos (Sharp + Flux + Kling single-image) por corromper identidades.

- **Arquitectura Anterior (DESCARTADA):**

  ```
  Sharp Compositing → Flux img2img → Kling (1 imagen) → Video
  Problema: Perdía identidad del producto y marca
  ```

- **Arquitectura Actual (KLING ELEMENTS):**
  ```
  Fal.ai Kling Elements API (input_image_urls: [persona, producto]) → Video
  Ventaja: Multi-image nativo, preserva ambas identidades
  ```

### 2. Código Eliminado (~300 líneas)

| Función                   | Propósito Original | Razón de Eliminación                |
| ------------------------- | ------------------ | ----------------------------------- |
| `composeScene()`          | Sharp compositing  | Reemplazado por multi-image nativo  |
| `detectProductCategory()` | Vision AI OCR      | No necesario con referencia directa |
| `removeBackground()`      | BiRefNet RMBG      | No necesario con multi-image        |

### 3. Async Queue Implementation

Para evitar timeout de Vercel (120s), se implementó cola asíncrona:

- **Backend:** `fal.queue.submit()` retorna inmediatamente con `request_id`
- **Nuevo Endpoint:** `/api/fal-status.js` para polling
- **Frontend:** Detecta provider `fal` y hace polling al endpoint correcto

### 4. Resultados Actuales

| Elemento                     | Estado              | Notas                                     |
| ---------------------------- | ------------------- | ----------------------------------------- |
| **Imagen 1 (Modelo/Sujeto)** | ✅ PERFECTO         | Identidad preservada al 100%              |
| **Imagen 2 (Producto)**      | ⚠️ Parcial          | Forma OK, pero marca/texto no preservados |
| **Video Storage**            | 🔧 En investigación | Videos no persisten correctamente         |
| **Tab Switching**            | 🔧 Bug              | Página se refresca al cambiar pestañas    |

### 5. Próximos Pasos

1. **Storage:** Investigar por qué videos no persisten en Supabase
2. **Product Identity:** Evaluar opciones para preservar marcas/texto
3. **Tab Refresh Bug:** Investigar issue de SPA/React state

### 6. Configuración Actual (Fal.ai)

```javascript
// generate.js - Kling Elements Call
fal.queue.submit('fal-ai/kling-video/v2/master/image-to-video', {
  input: {
    prompt: klingPrompt,
    image_url: finalStartImage,
    input_image_urls: [finalStartImage, finalEndImage],
    duration: '5' | '10',
    aspect_ratio: aspect_ratio,
    cfg_scale: 0.5,
    negative_prompt: 'blur, distort, low quality, wrong product, different person',
  },
});
```

### 7. Costo por Video

- **Kling v2 Master 5s:** ~$0.50
- **Kling v2 Master 10s:** ~$1.00
- **Provider:** Fal.ai (NO Replicate - videos no aparecerán en dashboard de Replicate)
