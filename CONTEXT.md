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
