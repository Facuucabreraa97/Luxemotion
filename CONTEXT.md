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
- **Galería/Ranking:** Sistema de valoración de los influencers más exitosos.

## 3. Business Goals (2026 Roadmap)

- **Prioridad Actual (Q1-Q2):** Validación de monetización y activación de primeros creadores.
- **Infraestructura:** El sistema debe escalar para soportar la generación de video mejorada y la expansión de usuarios.

## 4. Branding & UI Guidelines

- **Estética:** Profesional pero accesible.
- **Assets Clave:** Logo, bio, y estética visual definida para redes y web.

## 5. Development Rules for AI Agents

1. **Monetización:** Nunca alterar la lógica que calcula créditos o pagos en el Marketplace.
2. **Seguridad:** Todos los endpoints deben verificar autenticación y autorización server-side.
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

1. ~~**Storage:** Investigar por qué videos no persisten en Supabase~~ ✅ RESUELTO
2. ~~**Product Identity:** Evaluar opciones para preservar marcas/texto~~ ✅ INVESTIGADO (ver sección 8)
3. ~~**Tab Refresh Bug:** Investigar issue de SPA/React state~~ ✅ RESUELTO

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

---

## 📅 Actualización: Investigación Product Identity (03/02/2026)

### 8. Investigación Completa: Preservación de Identidad de Producto

El problema central: la Imagen 2 (producto) pierde logos, texto y detalles de marca en el video generado, mientras que la Imagen 1 (modelo/persona) se preserva perfectamente.

#### 8.1 Approaches INVESTIGADOS

| Approach                                | Descripción                              | Probabilidad Éxito | Estado                           |
| --------------------------------------- | ---------------------------------------- | ------------------ | -------------------------------- |
| **Kling 2.6 Pro**                       | Upgrade a versión más nueva              | 20%                | ❌ DESCARTADO                    |
| **First-Last Frame (Kling O1)**         | Keyframes start/end para interpolación   | 30%                | ❌ DESCARTADO                    |
| **Luma Ray3 Virtual Product Placement** | API específica para product placement    | 40%                | 🟡 INTEGRADO (pendiente API key) |
| **LoRA Training**                       | Entrenar modelo en producto específico   | 85%                | ❌ DESCARTADO (tiempo de espera) |
| **Overlay Post-Producción**             | Superponer producto estático sobre video | 95%                | ❌ DESCARTADO (complejidad)      |
| **Multi-Image Reference**               | Pedir más fotos del producto             | 50-60%             | 🟢 RECOMENDADO                   |

#### 8.2 Por qué se DESCARTÓ cada approach

**Kling 2.6 Pro:**

- Probado: Producía peores resultados que v2/master
- La imagen del producto era ignorada completamente
- Revertido inmediatamente

**First-Last Frame (Kling O1):**

- Implementado: Usaba `start_image_url` + `end_image_url`
- Problema: Cambiaba el comportamiento a "transición HACIA producto" en lugar de "persona CON producto"
- El video se convertía en morphing entre imagen A y B
- Revertido inmediatamente

**LoRA Training:**

- Alta efectividad (85%) pero requiere 15-30 min de training
- Para consumo masivo, nadie espera ese tiempo
- Cada producto nuevo necesitaría reentrenamiento
- Descartado por impracticidad para el modelo de negocio

**Overlay Post-Producción:**

- Garantizaría 100% fidelidad del producto
- Requiere: detección de manos, tracking de movimiento, composición frame-by-frame
- Complejidad muy alta para el beneficio
- Aumentaría tiempo de procesamiento significativamente
- Descartado por complejidad vs. target de consumo masivo

#### 8.3 Lo que SÍ se APLICÓ

**1. Luma Ray3 API Integration:**

- Endpoints creados: `/api/luma-generate.js` y `/api/luma-status.js`
- Usa keyframes (`frame0`, `frame1`) para product placement
- Estado: Listo para activar con `LUMA_API_KEY` en env vars
- Commit: `eaecedd`

**2. Bug Fixes (b67893a):**

- `VideoGenerationContext.tsx`: Provider restoration al recargar página
- `App.tsx`: Removido `<ToastProvider>` duplicado

#### 8.4 Conclusión: Realidad del Mercado

Los demos de competidores (Veo 3, Sora 2, Kling) que muestran logos perfectos:

1. Usan **Text-to-Video** (el AI genera "un Nike genérico", no preserva imagen específica)
2. Cherry-picking (muestran 1 de 20 intentos)
3. Post-producción manual

**Ningún modelo actual preserva texto/logos al 100%** desde imagen de referencia. Es limitación de la industria.

#### 8.5 Decisión Final (Consumo Masivo)

Para el modelo de negocio (whitelist + ads + entretenimiento):

- ✅ Mantener pipeline actual (Kling Elements)
- ✅ Priorizar experiencia del modelo/persona (funciona perfecto)
- ⚠️ Aceptar que producto será aproximado (forma/color OK, logo puede variar)
- ✅ Marketing honesto: "Videos AI con tu foto + producto"

---

## 📅 Bugs Resueltos (03/02/2026)

| Bug                         | Causa                                                 | Solución                                    | Commit    |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------- | --------- |
| **Videos no persisten**     | `pollStatus` no pasaba `provider` al restaurar sesión | Agregado `savedProvider` en `useEffect`     | `b67893a` |
| **Comportamiento errático** | `<ToastProvider>` duplicado en `App.tsx`              | Removido wrapper duplicado                  | `b67893a` |
| **Tab switching refresh**   | Vite HMR en modo desarrollo                           | NO es bug - es comportamiento normal de dev | N/A       |

---

## 📅 Actualización: Payment Gateway + Sidebar + i18n (11/02/2026)

### 9. Manual Payment Gateway (MercadoPago + Crypto)

Se implementó un sistema de pagos manuales completo con flujo de aprobación admin.

#### 9.1 Arquitectura

```
Usuario elige plan → CheckoutModal → Selecciona método → Sube comprobante
    → submit_manual_payment RPC → Estado 'pending_review'
    → Admin aprueba en PaymentApprovalsTab → review_payment RPC → Créditos acreditados
```

#### 9.2 Base de Datos

| Cambio | Archivo | Descripción |
|--------|---------|-------------|
| **ALTER TABLE `transactions`** | `payment_gateway_migration.sql` | Nuevas columnas: `payment_method`, `proof_url`, `tx_hash`, `review_status`, `reviewed_by`, `reviewed_at` |
| **CREATE TABLE `payment_methods_config`** | `payment_gateway_migration.sql` | Config editable para cada método de pago (alias, CVU, wallet, QR, instrucciones) |
| **RPC `submit_manual_payment`** | `payment_gateway_migration.sql` | Crea transacción con `review_status = 'pending_review'` |
| **RPC `review_payment`** | `payment_gateway_migration.sql` | Admin aprueba/rechaza; si aprueba, acredita créditos atómicamente |
| **Storage bucket `payments`** | `setup_payments_bucket.sql` | Políticas: read público, upload comprobantes (users), upload QR (admins) |

**REGLA CRÍTICA:** El RPC `review_payment` verifica `is_admin` y ejecuta crédito + actualización de estado en una transacción atómica.

#### 9.3 Métodos Seed

| Método | ID | Datos |
|--------|----|-------|
| **MercadoPago** | `mercadopago` | alias, CVU, qr_url, instrucciones |
| **USDT TRC-20** | `crypto_usdt_trc20` | wallet_address, network, qr_url, instrucciones |

#### 9.4 Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `supabase/payment_gateway_migration.sql` | Migración completa de DB |
| `supabase/setup_payments_bucket.sql` | Políticas de Storage bucket |
| `src/services/payment.service.ts` | Service layer: CRUD métodos, submit/review, upload proof |
| `src/pages/admin/PaymentConfigTab.tsx` | Admin: config de métodos (alias, CVU, wallet, QR upload) |
| `src/pages/admin/PaymentApprovalsTab.tsx` | Admin: aprobar/rechazar pagos pendientes |
| `src/components/CheckoutModal.tsx` | Modal multi-paso para checkout del usuario |

#### 9.5 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/pages/AdminDashboard.tsx` | +2 tabs en sidebar: "Payment Config" + "Payment Approvals" (con badge de pendientes) |
| `src/pages/Plans.tsx` | `handleSubscribe` abre `CheckoutModal` en vez de `alert()` |

#### 9.6 QR Fix

- Las `<img>` de QR tienen `onError` handler que oculta imágenes rotas
- `PaymentConfigTab` tiene botón **Upload QR** que sube directo al bucket `payments/qr-codes/`
- El admin puede pegar URL manualmente O subir imagen

---

### 10. Sidebar: Billing

- Nuevo NavLink `Billing` con ícono `CreditCard` en `Layout.tsx`
- Ubicación: debajo de Marketplace (desktop sidebar + mobile bottom dock)
- Ruta: `/app/billing` → `Plans.tsx` (ruta ya existía en `App.tsx`)

---

### 11. Sistema de Internacionalización (i18n)

Se implementó un sistema ES/EN completo con detección automática del idioma del navegador.

#### 11.1 Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/context/LanguageContext.tsx` | Contexto global + hook `useTranslation` + persistencia en `localStorage` |
| `src/locales/en.ts` | Diccionario inglés (sidebar, checkout, plans, common) |
| `src/locales/es.ts` | Diccionario español |
| `src/components/LanguageSwitcher.tsx` | Botón toggle 🇺🇸 EN / 🇦🇷 ES con ícono Globe |

#### 11.2 Integración

- `App.tsx` envuelto con `<LanguageProvider>` (contexto global)
- `Layout.tsx` (Sidebar): todos los labels usan `t('sidebar.studio')`, `t('sidebar.billing')` etc.
- `LanguageSwitcher` ubicado en el footer del sidebar (arriba de Sign Out)
- Auto-detecta idioma del browser en primera visita
- Diccionarios incluyen claves para: sidebar, checkout modal, plans page, y textos comunes

#### 11.3 Uso

```typescript
// En cualquier componente dentro de <LanguageProvider>
const { t, language, setLanguage } = useTranslation();
return <span>{t('sidebar.billing')}</span>; // → "Billing" o "Facturación"
```

---

### 12. Commits Recientes

| Commit | Descripción |
|--------|-------------|
| `5d48867` | feat: manual payment gateway - MercadoPago + Crypto support |
| `63d0697` | feat: QR fix + Sidebar Billing + i18n system (ES/EN) |

### 13. SQLs Pendientes de Ejecución en Supabase

> ⚠️ **ACCIÓN REQUERIDA:** Ejecutar estos archivos en Supabase SQL Editor para que las nuevas features funcionen:

1. `supabase/payment_gateway_migration.sql` — Tablas, columnas, RLS, RPCs
2. `supabase/setup_payments_bucket.sql` — Bucket de storage + políticas

---

## 📅 Actualización: Auditoría de Seguridad Módulo 1 — Pagos y Admin (17/02/2026)

### 14. Auditoría Pre-Lanzamiento: Pasarela de Pagos, Admin Panel, Storage

Se realizó una auditoría completa de seguridad sobre el sistema de pagos manuales, el panel de administración y las políticas de storage. Se identificaron **6 vulnerabilidades** (2 críticas, 2 altas, 1 media, 1 baja) y se generaron parches para todas.

#### 14.1 Hallazgos y Parches

| # | Severidad | Hallazgo | Parche |
|---|-----------|----------|--------|
| 1 | 🔴 CRÍTICA | Race condition en `review_payment`: sin `FOR UPDATE` lock, doble-review acredita créditos 2x | `fix_review_payment_race_condition.sql` |
| 2 | 🔴 CRÍTICA | Admin panel guard solo en frontend (React state): inyectable via DevTools | `AdminDashboard.tsx` (server-side verification) |
| 3 | 🟠 ALTA | Payment proofs globalmente legibles: cualquier usuario puede ver comprobantes de otros | `fix_payments_storage_policies.sql` |
| 4 | 🟠 ALTA | Falta policy DELETE en storage bucket `payments` | `fix_payments_storage_policies.sql` |
| 5 | 🟡 MEDIA | `updateCredits` en `admin.service.ts` usa patrón TOCTOU no atómico (read → calculate → write) | `fix_admin_credits_atomic.sql` + `admin.service.ts` |
| 6 | 🟢 BAJA | Anti-fraud `checkDuplicateTxHash` solo en frontend | ✅ Backend ya protegido por `UNIQUE INDEX` |

#### 14.2 Archivos Nuevos (SQL)

| Archivo | Propósito |
|---------|-----------|
| `supabase/fix_review_payment_race_condition.sql` | `SELECT ... FOR UPDATE` en `review_payment` para prevenir doble-credit |
| `supabase/fix_transactions_rls.sql` | RLS `SELECT` scoped: users solo ven sus propias transacciones, admins ven todo |
| `supabase/fix_payments_storage_policies.sql` | Reads scoped por carpeta (`qr-codes/` público, `payment-proofs/` solo admin) + DELETE policies |
| `supabase/fix_admin_credits_atomic.sql` | RPC `admin_adjust_credits`: operación atómica `credits = credits + delta` con floor en 0 |

#### 14.3 Archivos Modificados (TypeScript)

| Archivo | Cambio |
|---------|--------|
| `src/pages/AdminDashboard.tsx` | Server-side `is_admin` check al montar: query a `profiles` antes de cargar datos admin |
| `src/services/admin.service.ts` | `updateCredits` usa `supabase.rpc('admin_adjust_credits')` en vez de read-then-write |

**REGLA CRÍTICA:** El RPC `review_payment` ahora usa `FOR UPDATE` row-level lock. Esto garantiza que dos reviews concurrentes sobre la misma transacción **nunca** dupliquen créditos.

### 15. SQLs de Auditoría Módulo 1 — ✅ Ejecutados (18/02/2026)

> ✅ **COMPLETADO:** Los 4 parches SQL del Módulo 1 fueron ejecutados exitosamente en Supabase SQL Editor.

1. ✅ `supabase/fix_review_payment_race_condition.sql` — Race condition fix
2. ✅ `supabase/fix_transactions_rls.sql` — RLS scoped para transactions
3. ✅ `supabase/fix_payments_storage_policies.sql` — Storage reads scoped + DELETE
4. ✅ `supabase/fix_admin_credits_atomic.sql` — RPC atómico para créditos

---

## 📅 Actualización: Auditoría de Seguridad Módulo 2 — Pipeline de Generación (18/02/2026)

### 16. Auditoría: Generación de Video (Fal.ai + Luma Ray3)

Se auditó el pipeline completo de generación de video. Se encontraron **3 vulnerabilidades** relacionadas con pérdida de créditos en caso de fallos.

| # | Archivo | Hallazgo | Fix |
|---|---------|----------|-----|
| 1 | `api/luma-generate.js` | Créditos se deducían DESPUÉS del API call + RPC name incorrecto | Deducción ANTES + nombre correcto `decrease_credits` + refund automático en catch |
| 2 | `api/fal-status.js` | Sin refund cuando Fal.ai reporta estado FAILED | Refund automático usando costo almacenado en `generations` |
| 3 | `api/luma-status.js` | Sin refund cuando Luma reporta estado failed | Refund automático usando costo almacenado en `generations` |

**REGLA CRÍTICA:** Todo endpoint de generación ahora sigue el patrón: deducir créditos → llamar API → si falla en cualquier punto → refund atómico vía `decrease_credits`.

---

## 📅 Actualización: Cleanup Módulo 3 — Technical Debt (18/02/2026)

### 17. Limpieza de Deuda Técnica

Se eliminaron todas las referencias al deprecated "Modo Velvet", dependencias muertas, y scripts obsoletos. **13 archivos, -1,119 líneas.**

#### 17.1 Velvet Eradication

| Archivo | Cambio |
|---------|--------|
| `src/pages/Plans.tsx` | "Velvet Rope Priority" → "Priority Queue (Skip the Line)" |
| `CONTEXT.md` | Eliminado Modo Velvet de módulos y reglas de desarrollo |
| `scripts/analyze_failure.js` | "unsecured Velvet Mode" → "unsecured endpoints" |
| `PROPOSAL.md` | Archivado a `docs/archive/PROPOSAL.md` |

**Verificación:** `grep -ri velvet` en `src/` y `api/` → **0 resultados** ✅

#### 17.2 Dependencias Eliminadas

```
npm uninstall sharp stripe i18next-http-backend → -36 paquetes
```

#### 17.3 Archivos Eliminados (7)

- `test-lab/` (3 archivos) — Benchmarks de Sharp/SDXL
- `scripts/singularity_*.cjs` (3 archivos) — Tools de auditoría legacy
- `scripts/check_debug_collage.js` — Debug tool de Sharp

#### 17.4 i18n

Verificado: `en.ts` y `es.ts` — 30 keys cada uno, simetría perfecta.

---

## 📅 Actualización: Auditoría Módulo 3.5 — Marketplace & Edge Functions (18/02/2026)

### 18. Auditoría: Gallery, Prompt History, Edge Functions

Se auditaron 11 archivos del marketplace, historial de prompts, y Edge Functions de Supabase. Se encontraron **6 vulnerabilidades** (2 críticas).

#### 18.1 Hallazgos y Parches

| # | Severidad | Hallazgo | Patch |
|---|-----------|----------|-------|
| 1 | 🔴 CRÍTICA | `generations` RLS con `USING(true)`: cualquier usuario podía leer los prompts de todos | `fix_generations_rls.sql` ✅ Ejecutado |
| 2 | 🔴 CRÍTICA | `execute-purchase` EF: TOCTOU + sin locks, duplicaba `buy_talent` RPC | Eliminado completamente |
| 3 | 🟡 MEDIA | `mint-asset` EF: TOCTOU en créditos, sin refund si falla insert del asset | Reescrito con RPC atómico + refund |
| 4 | 🟡 MEDIA | `manage-credits` EF: TOCTOU read-then-write en créditos | Reescrito con `admin_adjust_credits` RPC |
| 5 | 🟡 MEDIA | `check-whitelist` EF: permitía lookups sin autenticación | JWT obligatorio + scope por email |
| 6 | 🟢 BAJA | `execute-purchase` EF: código muerto, fee structure inconsistente con RPC | Eliminado |

#### 18.2 Componentes Confirmados Seguros

| Componente | Estado |
|------------|--------|
| `buy_talent` RPC (v3) | ✅ Atómico, `FOR UPDATE` locks, anti-self-dealing, royalties |
| `send-email` EF | ✅ Verificación JWT de admin |
| `get-user-credits` EF | ✅ JWT auth, solo retorna créditos propios |

**REGLA CRÍTICA:** Toda operación de créditos en Edge Functions debe usar RPCs atómicos (`decrease_credits`, `admin_adjust_credits`). Nunca usar el patrón read → calculate → write.

---

## 📅 Actualización: Auditoría Módulo 3.8 — Storage & Anti-Abuso (18/02/2026)

### 19. Auditoría: Storage Buckets, Rate Limiting, Ranking

Se auditaron los storage buckets, las 5 rutas API de Vercel, y la lógica de ranking de la galería. Se encontraron **4 vulnerabilidades** y se generó un schema preemptivo.

#### 19.1 Hallazgos y Parches

| # | Severidad | Hallazgo | Patch |
|---|-----------|----------|-------|
| 1 | 🔴 ALTA | `uploads` bucket sin políticas RLS — cualquier user podía leer/borrar archivos de otros | `fix_uploads_storage_policies.sql` |
| 2 | 🔴 ALTA | `fal-status.js` y `luma-status.js` sin autenticación ni rate limiting | JWT + 20 req/min rate limit añadidos |
| 3 | 🟡 MEDIA | Sin validación MIME/tamaño en uploads (hosting potencial de malware) | `fix_uploads_bucket_config.sql` + client-side validation en `storage.service.ts` |
| 4 | 🟢 INFO | No existe sistema de likes — schema preemptivo creado | `create_likes_table.sql` (ejecutar cuando se implemente) |

#### 19.2 Rate Limiting — Middleware Centralizado

Se creó `api/lib/rateLimit.js` con rate limiter in-memory y verificador JWT. Aplicado a todas las rutas:

| Route | Rate Limit | Auth |
|-------|-----------|------|
| `generate.js` | 5 req/min | ✅ JWT (preexistente) |
| `luma-generate.js` | 5 req/min | ✅ JWT (preexistente) |
| `fal-status.js` | 20 req/min | ✅ JWT (nuevo) |
| `luma-status.js` | 20 req/min | ✅ JWT (nuevo) |
| `get-credits.js` | — | ✅ JWT (preexistente) |

**REGLA CRÍTICA:** Toda nueva ruta API en `api/` debe importar y usar `rateLimit` y `verifyAuth` de `api/lib/rateLimit.js`.

### 20. SQLs Pendientes de Ejecución (Módulo 3.8)

> ⚠️ **ACCIÓN REQUERIDA:** Ejecutar en Supabase SQL Editor:

1. `supabase/fix_uploads_storage_policies.sql` — RLS para uploads bucket
2. `supabase/fix_uploads_bucket_config.sql` — MIME types + file size limits
3. `supabase/create_likes_table.sql` — ⏳ Solo cuando se implemente el feature de likes
