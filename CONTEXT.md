# MivideoAI - Project Context & Business Rules

## 1. Core Identity
**Product:** MivideoAI (Marketplace de Influencers IA).
[cite_start]**Value Prop:** Plataforma unificada para crear, comprar, vender y monetizar influencers generados por IA[cite: 1, 2].
**Target Audience:** Creadores de contenido, Agencias de Marketing, Marcas.

## 2. Key Modules (Critical Logic)
El sistema se compone de los siguientes módulos críticos. Cualquier refactorización debe preservar su integridad:

* **Marketplace:** El núcleo transaccional. [cite_start]Permite la compra/venta de personajes digitales (Assets)[cite: 34, 35].
* [cite_start]**Studio de Creación:** Herramientas para generar contenido de video/imagen de los influencers[cite: 28, 29].
* [cite_start]**Modo Casting:** Algoritmos de match entre marcas e influencers según estilo y KPI[cite: 30, 31].
* **Modo Velvet (+18):** Generación de contenido adulto. **REGLA CRÍTICA:** Debe ser privado, controlado y automatizado. [cite_start]La seguridad y privacidad en este módulo es prioridad máxima[cite: 26, 27].
* [cite_start]**Galería/Ranking:** Sistema de valoración de los influencers más exitosos[cite: 32, 33].

## 3. Business Goals (2026 Roadmap)
* [cite_start]**Prioridad Actual (Q1-Q2):** Validación de monetización y activación de primeros creadores[cite: 16, 17, 20].
* [cite_start]**Infraestructura:** El sistema debe escalar para soportar la generación de video mejorada y la expansión de usuarios[cite: 20, 22].

## 4. Branding & UI Guidelines
* **Estética:** Profesional pero accesible.
* [cite_start]**Assets Clave:** Logo, bio, y estética visual definida para redes y web[cite: 37, 38].

## 5. Development Rules for AI Agents
1.  **Monetización:** Nunca alterar la lógica que calcula créditos o pagos en el Marketplace.
2.  **Privacidad:** El contenido generado en "Modo Velvet" nunca debe ser accesible públicamente sin autenticación estricta.
3.  **Performance:** La generación de video es costosa; optimizar cualquier código relacionado con llamadas a APIs de generación.
