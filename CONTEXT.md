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

---

## 📅 Actualización: Auditoría Módulo 3.9 — SecOps & Performance Core (18/02/2026)

### 21. Auditoría: Fuga de Secretos, Video Performance, Error States

Se auditaron los logs de API, el rendimiento de video en frontend, y los estados de error UI.

#### 21.1 Hallazgos y Parches

| # | Severidad | Hallazgo | Patch |
|---|-----------|----------|-------|
| 1 | 🔴 ALTA | Raw `error` objects logueados en stdout (visibles en Vercel Logs) | `generate.js`, `fal-status.js`, `luma-status.js`, `luma-generate.js` — sanitizados |
| 2 | 🔴 ALTA | `error.message` enviado en respuestas 500 al cliente | Reemplazado por `"Internal Server Error"` genérico en 4 endpoints |
| 3 | 🔴 ALTA | `<video autoPlay>` en TODOS los cards de Marketplace y Profile — sin poster, sin lazy, sin preload | Nuevo componente `LazyVideo.tsx` con IntersectionObserver |
| 4 | 🟡 MEDIA | Zero `onError` fallbacks en `<video>` o `<img>` de la galería | `LazyVideo` incluye fallback, `<img>` tags con `onError` handler |
| 5 | 🟡 MEDIA | `console.error(error)` en 6 servicios frontend | Sanitizados a `error.message` en `user/market/payment/admin.service.ts` |

#### 21.2 LazyVideo Component

`src/components/LazyVideo.tsx` — Componente de video con IntersectionObserver:
- Solo carga `<video>` cuando está a ≤200px del viewport
- Auto-pause al hacer scroll fuera de la vista
- Spinner de carga + fallback emoji si el video falla
- Integrado en `Marketplace.tsx` y `Profile.tsx`

**REGLA CRÍTICA:** Todo `<video>` nuevo en grids/listas debe usar `<LazyVideo>` en vez de `<video autoPlay>`. Los modals interactivos pueden usar `<video controls>` normal.

**REGLA CRÍTICA:** Nunca loguear objetos `error` completos. Usar `error instanceof Error ? error.message : 'Unknown'`. Nunca enviar `error.message` en respuestas HTTP.

---

## 📅 Actualización: Auditoría Módulo 3.10 — Economía Oculta y Anti-Abuso (18/02/2026)

### 22. Auditoría: Misiones, Registro, Waitlist Bypass

Se auditaron las misiones/gamificación, el trigger de registro, y los controles de acceso de la waitlist.

#### 22.1 Hallazgos y Parches

| # | Severidad | Hallazgo | Patch |
|---|-----------|----------|-------|
| 1 | 🔴 CRÍTICA | Whitelist UPDATE permitía a cualquier usuario autenticado auto-aprobarse | `fix_whitelist_rls.sql` — admin-only policy |
| 2 | 🔴 CRÍTICA | `handle_new_user()` daba 100 CR al signup sin verificación ni CAPTCHA | `fix_welcome_credits.sql` — 0 CR al signup, 100 CR al aprobarse |
| 3 | 🔴 CRÍTICA | `claimQuest()` y `trackAction()` 100% client-side, manipulable desde consola | `fix_gamification_rls.sql` — tables read-only |
| 4 | 🟢 INFO | `check-whitelist` leakeaba `error.message` en 400 responses | Sanitizado a `"Bad Request"` |

**REGLA CRÍTICA:** Las tablas de gamificación son READ-ONLY vía RLS. Toda operación de write (track, claim) debe implementarse como RPC server-side antes de reactivar el feature.

**REGLA CRÍTICA:** La tabla `whitelist` solo puede ser actualizada por admins (`is_admin = true`). Nunca crear policies de UPDATE para `authenticated` genérico.

### 23. SQLs Pendientes de Ejecución (Módulo 3.10)

> ⚠️ **ACCIÓN REQUERIDA:** Ejecutar en Supabase SQL Editor:

1. `supabase/fix_whitelist_rls.sql` — 🔴 CRÍTICO: Cerrar vector de auto-aprobación
2. `supabase/fix_welcome_credits.sql` — 🔴 CRÍTICO: Cerrar vector de farming de créditos
3. `supabase/fix_gamification_rls.sql` — Lockdown de tablas de gamificación

---

## 📅 Actualización: Auditoría Módulo 3.11 — Sanitización de Uploads y DB Constraints (18/02/2026)

### 24. Auditoría: Upload Bucket, Frontend Validation, Credits Constraint

Se auditó el bucket de uploads del Studio, la validación frontend de archivos, y la integridad de créditos a nivel de base de datos.

#### 24.1 Hallazgos y Parches

| # | Severidad | Hallazgo | Patch |
|---|-----------|----------|-------|
| 1 | 🔴 CRÍTICA | No existía `CHECK (credits >= 0)` en `profiles` — créditos podían ir a negativo | `fix_credits_constraint.sql` |
| 2 | 🟠 ALTA | `decrease_credits()` tenía TOCTOU: SELECT + UPDATE separados | `fix_decrease_credits_v2.sql` — single atomic UPDATE |
| 3 | 🟡 MEDIA | Studio `handleImageUpload` no validaba tipo ni tamaño antes del preview | Validación temprana en `Studio.tsx` |
| 4 | 🟢 INFO | `accept="image/*"` permitía SVG, TIFF, BMP | Cambiado a `.png,.jpg,.jpeg,.webp,.gif` |
| ✅ | OK | Bucket config, storage RLS, y `storage.service.ts` ya estaban correctos | N/A |

**REGLA CRÍTICA:** Todo nuevo `handleImageUpload` o similar debe validar MIME y tamaño ANTES de crear el preview. Los formatos permitidos son: `image/png`, `image/jpeg`, `image/webp`, `image/gif`. Máximo 10MB.

**REGLA CRÍTICA:** Nunca hacer `SELECT credits ... IF credits >= amount ... UPDATE credits` en pasos separados. Usar `UPDATE ... WHERE credits >= amount` en un solo statement atómico.

### 25. SQLs Pendientes de Ejecución (Módulo 3.11)

> ⚠️ **ACCIÓN REQUERIDA:** Ejecutar en Supabase SQL Editor:

1. `supabase/fix_credits_constraint.sql` — 🔴 CRÍTICO: Hard constraint `credits >= 0`
2. `supabase/fix_decrease_credits_v2.sql` — 🔴 CRÍTICO: Fix TOCTOU race condition

### 26. Módulo 3.12: Business Killers & Lógica Final

| # | Sev | Hallazgo | Patch |
|---|-----|----------|-------|
| 1 | 🔴 CRÍTICA | RPC `decrease_credits` llamada con params viejos (`user_id`, `amount`) — roto tras Patch 3.11-B | Renombrado a `p_user_id`, `p_amount` en `generate.js`, `luma-generate.js` |
| 2 | 🟠 ALTA | Fallback `UPDATE profiles SET credits=...` en `generate.js` y `luma-generate.js` — bypass del RPC atómico | Eliminado — si RPC falla, aborta con 402 |
| 3 | 🟡 MEDIA | `cost_in_credits \|\| 250` hardcodeado en refunds de `fal-status.js` y `luma-status.js` | Eliminado — si es null, log CRITICAL y skip |
| 4 | 🟡 MEDIA | Sin enforcement server-side de expiración de planes (`current_period_end`) | Documentado — bajo impacto (credit-based) |
| ✅ | OK | Precios server-side (`TIER_CONFIG`), zombie gen recovery, JWT en todos los API routes | N/A |

**REGLA CRÍTICA:** Toda operación de créditos DEBE usar RPCs atómicos (`decrease_credits`, `increase_credits`). Queda PROHIBIDO hacer `UPDATE profiles SET credits=...` directo en cualquier API route.

### 27. Módulo 3.13-3.15: Rescate Financiero & UX Polish

**Matriz de Costos Rígida (server-side):**

| Tier | Créditos | Modelo |
|------|----------|--------|
| Draft | 50 CR | Wan-2.1 (480p) |
| Master 5s | 400 CR | Kling v2.5 Pro |
| Master 10s | 800 CR | Kling v2.5 Pro |
| Luma Ray | 400 CR | Luma |

**Cambios aplicados:**
- `generate.js`: TIER_CONFIG refactorizado, cost calc duration-aware para master
- `luma-generate.js`: LUMA_COST = 400
- `Plans.tsx`: Bullets corregidos (~24 Drafts / 3 Masters, ~80/10, ~240/30)
- `Studio.tsx`: TIER_COSTS dinámicos, botón Generate muestra CR según tier+duration
- `Studio.tsx`: "Subject" → "Start Frame", "Context (End)" → "End Frame"
- `Studio.tsx`: i18n fix — "Segundos" → "Seconds", "Procesando" → "Processing"

**REGLA:** El frontend NUNCA dicta precios. `TIER_CONFIG` en `generate.js` es la única fuente de verdad.

### 28. Módulo 3.16: UX Persistence, Model Routing & Style Vibes

**Nuevas capacidades:**

- **Image Generation Route**: `type=image` → Flux via fal.ai (15 CR). `generate.js` ahora rutea a `fal-ai/flux/dev/image-to-image` o `fal-ai/flux/dev` según si hay imagen de entrada.
- **Studio Tabs**: 3 modos — "Text to Video" | "Image to Video" | "Image Gen (15 CR)". En modo Image Gen, se ocultan Duration y Quality Tier.
- **Session Persistence**: `sessionStorage` guarda prompt, duration, tier, styleMode, aspectRatio, mode y seed. Se restaura al montar el componente.
- **Style Vibes**: Ya funcionaban server-side (L253-256 de generate.js). Se agregaron subtítulos UX: "8K, dramatic lighting, film grade" (Cinematic) y "UGC, smartphone, TikTok style" (Organic).

**Matriz final completa:**

| Tipo | CR | Modelo | Endpoint |
|------|-----|--------|----------|
| Image | 15 | Flux | fal-ai/flux/dev |
| Draft Video | 50 | Wan-2.1 | fal-ai/wan-i2v |
| Master 5s | 400 | Kling v2.5 Pro | fal-ai/kling-video/v2/master |
| Master 10s | 800 | Kling v2.5 Pro | fal-ai/kling-video/v2/master |
| Luma Ray | 400 | Luma | api/luma-generate |

---

## 📅 Actualización: Módulo 3.19-3.21 — Gallery UX & Video Previews (25/02/2026)

### 29. Video Previews (Definitive Approach)

Se reescribió `LazyVideo.tsx` para resolver el bug de previews en blanco en la galería y marketplace.

**Estrategia:**
- `<video>` siempre en el DOM con `preload="metadata"`
- Seek programático a `0.1s` en `loadeddata` para renderizar el primer frame nativamente
- Overlay `<img>` con poster cubre el flash negro inicial
- Hover → `.play()`, mouse leave → `.pause()` + seek a frame 0
- IntersectionObserver controla solo el atributo `src`

**Archivos modificados:**

| Archivo | Cambio |
|---------|--------|
| `src/components/LazyVideo.tsx` | Reescritura completa — estrategia definitiva |
| `src/pages/Profile.tsx` | Poster prop, fallback para imágenes expiradas, play overlay limpio |
| `src/pages/Marketplace.tsx` | Agregado `poster={asset.image_url}` a `LazyVideo` |

### 30. Gallery UX: Naming & Tabs

| Feature | Implementación |
|---------|---------------|
| **Tab "Vault"** | "Drafts" → "Vault" para evitar confusión con Draft de Wan |
| **Rename visible** | Ícono ✏️ aparece en hover (reemplaza double-click) |
| **Rename lock** | Si `for_sale === true` → ícono no aparece (nombre bloqueado) |
| **SPA Navigation** | `<a>` → `<Link>` de react-router-dom para ir al Studio |

### 31. Storage Persistence (Flux Images)

**Bug:** Las imágenes generadas con Flux solo tenían URL temporal de fal.ai (~24h).

**Fix en `api/fal-status.js`:**
- Detecta si el resultado es imagen (`images[0].url`) o video (`video.url`)
- Upload a Supabase `videos` bucket con extensión correcta (`.png` / `.mp4`)
- `renameAsset()` agregado a `MarketService`

### 32. Commits

| Commit | Descripción |
|--------|-------------|
| `c19e4c8` | LazyVideo rewrite + gallery fixes |
| `bab8f02` | Definitive video preview approach |
| `ab594da` | Vault tab + discoverable edit icon |
| `f6ab582` | Fix duplicate tab label |
| `d42e9d2` | Fix decrease_credits RPC params for minting |

---

## 📅 Actualización: Auditoría de Seguridad Global (25/02/2026)

### 33. Auditoría Comprehensiva — 11 Vulnerabilidades Corregidas

Se ejecutó un audit de seguridad completo sobre toda la plataforma. Se encontraron y corrigieron **6 vulnerabilidades de seguridad**, **5 bugs de lógica de negocio**, y se eliminaron **26 scripts legacy**.

#### 33.1 Seguridad

| # | Sev | Hallazgo | Fix |
|---|-----|----------|-----|
| §1.1 | 🔴 CRÍTICA | `approve-user.ts` sin autenticación ni verificación admin | JWT + `is_admin` check + `VITE_SUPABASE_URL` → `SUPABASE_URL` |
| §1.2 | 🔴 CRÍTICA | `server.js` con mock endpoints sin auth (`/api/market/buy`) | Archivo eliminado (no usado por Vercel) |
| §1.3 | 🟠 ALTA | CORS `*` en Edge Functions | Restringido a `mivideoai.com` vía env var |
| §1.4 | 🟠 ALTA | `enable_safety_checker: false` en 3 llamadas de Fal.ai | Cambiado a `true` |
| §1.5 | 🟡 MEDIA | Rate limiter in-memory (inefectivo en Vercel serverless) | Upstash Redis + fallback in-memory |

#### 33.2 Lógica de Negocio

| # | Sev | Hallazgo | Fix |
|---|-----|----------|-----|
| §2.1 | 🔴 CRÍTICA | `listAsset()` y `renameAsset()` sin filtro `owner_id` | Verificación de ownership + `for_sale` check en rename |
| §2.2 | 🟠 ALTA | TOCTOU en `finalizeMint()` — SELECT+check antes del RPC atómico | Pre-check eliminado — RPC maneja todo |
| §2.3 | 🟠 ALTA | Refund en `mint-asset` usaba `decrease_credits` con monto negativo | Cambiado a `increase_credits` con monto positivo |
| §2.4 | 🟡 MEDIA | `manage-credits` fallback con `.raw()` inexistente | Fallback eliminado — error propagado |
| §2.6 | 🟠 ALTA | Variable shadowing `user` en `luma-generate.js` — refunds nunca se ejecutaban | `let user` → `let authenticatedUser` |

#### 33.3 Cleanup

- **26 scripts legacy eliminados:** `FixDeps.js`, `Phoenix_Cleanup.js`, `VoidStrategy.js`, `RebornApp.js`, `RestoreMonolith.js`, etc.
- **`server.js` eliminado** (mock ExpressJS local, no usado en producción)

#### 33.4 Rate Limiter: Upstash Redis

`api/lib/rateLimit.js` ahora usa sliding window via `@upstash/ratelimit`:
- Si `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` están configurados → Redis persistente
- Si no → fallback in-memory (protección parcial)
- Todos los callers ahora usan `await rateLimit()`

**REGLA CRÍTICA:** `rateLimit()` es ahora `async`. Todo nuevo endpoint DEBE usar `if (await rateLimit(req, res, opts)) return;`.

#### 33.5 Commit

| Commit | Descripción |
|--------|-------------|
| `d2ed7e4` | security: AUDIT FIX — auth, CORS, safety checker, ownership, user shadowing, refund logic, rate limiter, 26 scripts purged |

#### 33.6 Infraestructura: Upstash

- Integración Vercel ↔ Upstash Redis configurada (proyecto "luxemotion", db "mivideoai")
- Env vars `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` inyectadas automáticamente por la integración

---

## 📅 Actualización: Pasarela de Pagos Perfeccionada (27/02/2026)

### 34. Auditoría Exhaustiva — Pasarela de Pagos (12 Hallazgos)

Se realizó una auditoría completa del sistema de pagos manuales, identificando **12 issues** en seguridad, lógica de negocio y UX.

#### 34.1 Seguridad (Críticos)

| # | Fix |
|---|-----|
| F-1 | Upload de comprobantes: validación real de MIME (PNG/JPG/WebP) + máx 5MB |
| F-2 | Error messages de Supabase sanitizados — no más leaks de internals |
| F-3 | Anti-flood: máx 3 pagos pending por usuario (SQL RPC) |
| F-5 | `anon` SELECT revocado de `payment_methods_config` |

#### 34.2 Lógica de Negocio

| # | Fix |
|---|-----|
| F-4 | Yearly billing: créditos ahora muestran total anual (× 12), no solo mensual |
| F-7 | QR upload en admin validado (tipo + tamaño) |
| F-8 | Doble submit bloqueado con `useRef` guard |
| F-12 | Clipboard con fallback `execCommand` para HTTP |

#### 34.3 Nuevos Métodos

- `PaymentService.getUserPaymentHistory(userId)` — historial de pagos del usuario
- `PaymentService.checkDuplicateTxHash()` — anti-fraude por hash duplicado

#### 34.4 SQL

| Archivo | Propósito |
|---------|-----------|
| `supabase/fix_payment_flood.sql` | Límite 3 pending + revoke anon en payment config |

#### 34.5 Commits

| Commit | Descripción |
|--------|-------------|
| `e431e51` | security: payment gateway audit — 12 fixes |

---

### 35. UX Checkout — Mejoras de Experiencia

#### 35.1 Step Progress Indicator

`CheckoutModal.tsx` ahora muestra barra visual `①Method → ②Details → ③Proof` con transiciones CSS. Pasos completados en verde ✓, paso activo con glow blanco.

#### 35.2 "My Payments" en Plans

`Plans.tsx` muestra tabla de historial de pagos del usuario con badges de estado:
- 🟡 Pending — esperando revisión
- 🟢 Approved — créditos acreditados
- 🔴 Rejected — pago rechazado

Se auto-refresca al cerrar el checkout modal.

#### 35.3 Pending Credits Banner

Banner amber en Plans: "X,XXX CR pending approval" — solo visible si hay pagos pendientes.

#### 35.4 Commits

| Commit | Descripción |
|--------|-------------|
| `1d6bd4d` | ux: step progress indicator, payment history, pending credits banner |

---

### 36. Dynamic i18n CMS — Arquitectura SWR

Se migró el sistema de i18n estático a un CMS dinámico manejable desde el Admin Panel.

#### 36.1 Arquitectura

```
Static en.ts/es.ts ──┬──> LanguageContext (TTI=0)
localStorage cache ──┘        │
                          useEffect async
                               │
                    Check i18n_version (singleton)
                        │              │
                    version > local    up-to-date → skip
                        │
                 Fetch site_translations
                        │
                 Merge DB → dict → persist
```

#### 36.2 SQL: `supabase/i18n_cms_migration.sql`

- `site_translations(translation_key PK, value_en, value_es, updated_at)`
- `i18n_version(id=1, version)` — singleton para SWR cache control
- RLS: SELECT para authenticated, INSERT/UPDATE/DELETE solo admins
- Trigger `trg_bump_i18n_version`: auto-incrementa versión en cada cambio
- Seeds: 31 keys iniciales desde `en.ts`/`es.ts`

#### 36.3 LanguageContext Refactorizado

`src/context/LanguageContext.tsx`:
- Boot con **latencia cero** desde estáticos o localStorage
- `useEffect` async verifica `i18n_version` → si es mayor, fetchea todo y merge
- Fallback siempre funcional si la DB no responde

#### 36.4 TranslationsTab Admin UI

`src/pages/admin/TranslationsTab.tsx`:
- Tabla buscable agrupada por prefijo (`sidebar.`, `checkout.`, `plans.`)
- Textareas EN 🇺🇸 / ES 🇦🇷 lado a lado (simetría forzada)
- Dirty tracking visual (●amber en keys modificadas)
- Guardado atómico con `upsert` + contador de changes pendientes
- Agregar / eliminar keys desde la UI

#### 36.5 Sidebar integrado con i18n

`Layout.tsx` ya usa `t()` para todos los labels del menú: `t('sidebar.studio')`, `t('sidebar.gallery')`, etc. Los cambios en el CMS se reflejan automáticamente.

#### 36.6 Fix GRANT (02/03/2026)

`supabase/fix_i18n_grants.sql`:
- `GRANT ALL` sobre `site_translations` (antes solo SELECT bloqueaba saves)
- Políticas RLS explícitas por operación (INSERT con WITH CHECK, UPDATE/DELETE con USING)
- Trigger ahora incluye DELETE para bump de versión

#### 36.7 Commits

| Commit | Descripción |
|--------|-------------|
| `3942c00` | feat: dynamic i18n CMS — tables, SWR context, admin tab |

**REGLA CRÍTICA:** `site_translations` es la fuente de verdad una vez que el SQL se ejecuta. Los estáticos `en.ts`/`es.ts` son solo fallback para TTI=0 y para keys no presentes en la DB.

---

## 📅 Actualización: Auditoría de Seguridad Pre-Launch (03/03/2026)

### 37. Auditoría Comprehensiva — 14 Fixes de Seguridad y Bugs

Se ejecutó una auditoría exhaustiva de toda la plataforma enfocada en preparar la primera release. Se identificaron y corrigieron **14 issues** clasificados en seguridad, lógica de negocio, y limpieza técnica.

#### 37.1 Seguridad — IDOR y Sanitización

| # | Sev | Hallazgo | Fix |
|---|-----|----------|-----|
| §1 | 🔴 CRÍTICA | IDOR en `fal-status.js`: cualquier usuario podía leer/refundar generaciones de otro | Ownership check (`user_id === authUser.id`) + 403 + fix `cost_in_credits` missing en SELECT |
| §1b | 🔴 CRÍTICA | IDOR en `luma-status.js`: mismo vector que §1 | Ownership check + sanitized `failure_reason` leak |
| §2 | 🔴 ALTA | `send-email` EF: CORS `*`, XSS en templates, doble `serve()` (solo último ejecuta) | CORS restringido, HTML escaping, primer `serve()` removido |
| §3 | 🟠 ALTA | CORS `*` en `check-whitelist` y `get-user-credits` | ALLOWED_ORIGIN env var |
| §5 | 🟡 MEDIA | `approve-user.ts` leakeaba `err.message` en 500 | Generic "Internal Server Error" + server-side log |
| §7 | 🟡 MEDIA | `get-credits.js` logueaba objetos error completos | Sanitizado a `error.message` |
| §9 | 🟡 MEDIA | `generate.js` — 5 `console.error(error)` con objetos completos | Todos sanitizados |

#### 37.2 Lógica de Negocio

| # | Sev | Hallazgo | Fix |
|---|-----|----------|-----|
| §4 | 🟠 ALTA | `mint-asset` EF fallback con `.raw()` inexistente en supabase-js v2 | Fallback eliminado, error propagado |
| §6 | 🟡 MEDIA | Gamification writes (`addXP`, `trackAction`, `claimQuest`) client-side contra tablas RLS-locked | Deshabilitados con early returns + comments |
| §10 | 🟠 ALTA | Luma provider no ruteaba a `/api/luma-status` → videos nunca se resolvían | Provider detection en `VideoGenerationContext.tsx` |
| §11 | 🟠 ALTA | `finalizeMint()` sin ownership check — cualquier user podía activar draft de otro | `.eq('owner_id', user.id)` agregado |
| §12 | 🟡 MEDIA | `cost_in_credits` faltaba en SELECT de `fal-status.js` → refunds silently skipped | Agregado al SELECT |

#### 37.3 Limpieza

| # | Hallazgo | Fix |
|---|----------|-----|
| §8/§14 | Dead dependencies (i18next, express, cors, dotenv) + scripts muertos | `package.json` limpiado |
| §13 | Test file usaba `jest.fn()` en proyecto vitest | Migrado a `vi.fn()` |

**Build verificado:** `✓ built in 2.13s` — zero errors.

---

## 📅 Actualización: i18n Completo para Todas las Secciones (03/03/2026)

### 38. i18n CMS — Cobertura Total (Planes, Marketplace, Studio, Profile)

Se extendió el sistema de traducciones para cubrir **toda la aplicación**. Todo el texto visible al usuario es ahora editable desde el Admin → Translations CMS.

#### 38.1 Expansión de Diccionarios

`src/locales/en.ts` y `src/locales/es.ts`: **44 → ~130 keys** (+86 keys nuevas).

| Prefijo | Keys Nuevas | Contenido |
|---------|-------------|-----------|
| `plans.talent*` | 7 | Nombre, descriptor, 5 features, créditos |
| `plans.producer*` | 9 | Nombre, descriptor, 6 features, créditos, notes |
| `plans.mogul*` | 9 | Nombre, descriptor, 6 features, créditos, notes |
| `plans.pay*` | 9 | Headers tabla pagos, estados (Pending/Approved/Rejected), footer |
| `marketplace.*` | 13 | Título, subtítulo, search, buy, empty state, confirm dialogs |
| `studio.*` | 17 | Título, prompt, tiers (Draft/Master/Image), generate, processing |
| `profile.*` | 15 | Título, tabs (Vault/Transactions), mint, rename, empty states |

#### 38.2 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/locales/en.ts` | +86 keys (marketplace, studio, profile, plan details) |
| `src/locales/es.ts` | +86 keys (traducciones argentinas completas) |
| `src/pages/Plans.tsx` | Plan data array usa `t()`, footer, payment history headers, status labels |
| `src/pages/Marketplace.tsx` | +`useTranslation`, todos los strings: title, buy, empty, search, confirm |
| `src/modules/studio/Studio.tsx` | +`useTranslation`, header, tier labels, prompt placeholder, generate button |
| `src/pages/Profile.tsx` | +`useTranslation`, tab labels (Vault/Transactions), mint, price, loading |
| `src/pages/admin/TranslationsTab.tsx` | `handleSaveAll` ahora bumps `i18n_version` automáticamente |

#### 38.3 Flujo Admin → Usuario

```
Admin edita key en TranslationsTab → Save
    → upsert site_translations
    → UPDATE i18n_version = Date.now()
    → Próximo load del usuario compara version
    → version > local → fetch all → merge → cache
    → UI actualizado instantáneamente
```

#### 38.4 Ejemplo: Cambiar feature de un plan

1. Admin abre Translations → group `plans`
2. Edita `plans.producerFeature3` de "Priority Queue (Skip the Line)" a "VIP Express Queue"
3. Guarda → versión bumped
4. Usuario recarga → ve "VIP Express Queue" en el plan PRODUCER

**REGLA CRÍTICA:** Toda nueva string visible al usuario DEBE: (1) tener key en `en.ts` y `es.ts`, (2) usar `t('key')` en el componente. Las keys deben seguir el patrón `section.itemName` o `section.itemNameN` para features indexadas.

**Build verificado:** `✓ built in 2.13s` — zero errors.

