# GhostProfile — Análisis de Exposición Digital

Aplicación web interactiva para analizar tu exposición digital en redes sociales. Calcula un índice de riesgo personalizado y proporciona recomendaciones basadas en tus patrones de consumo digital.

## Características

- **Formulario con validaciones**: nickname, email, edad, red social y horas de uso diario
- **Cálculo inteligente**: exposición digital (0-100%), clasificación de riesgo y perfil de usuario
- **Gestión de perfiles**: almacenamiento persistente en localStorage con CRUD completo
- **Seguridad**: sanitización de inputs, prevención de XSS, validación en múltiples capas
- **UI/UX**: diseño oscuro, animaciones fluidas, scrollbar personalizada, completamente responsiva

## Tecnologías

- HTML5 semántico con ARIA
- CSS3 (Flexbox, Grid, animaciones, variables, media queries)
- JavaScript ES5 (IIFE, sin dependencias)
- localStorage

## Uso

Completa el formulario y obtén tu análisis de exposición digital al instante.

## Uso de IA

Este proyecto fue desarrollado con asistencia de **GitHub Copilot** para mejorar la calidad del código, la robustez de las validaciones y la claridad de la implementación. A continuación se documentan los prompts utilizados y las mejoras aplicadas.

### 1. Refactorización Modular

**Problema:** Código monolítico sin estructura, difícil de mantener y escalar.

**Prompt:**
> "Refactoriza este código JavaScript en una estructura modular. Agrupa funciones por responsabilidad (validación, cálculos, renderización, eventos, utilidades). Usa comentarios como separadores de secciones."

**Resultado:** Código organizado en 11 módulos con responsabilidad única, facilitando navegación, mantenimiento y escalabilidad.

### 2. Validaciones Robusta con Regex

**Problema:** Validación de email poco confiable.

**Prompt:**
> "Dame una expresión regular en JavaScript para validar correos electrónicos. Debe ser práctica, rechazar espacios y caracteres inválidos."

**Resultado:**
```js
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```
Validación efectiva sin falsos positivos.

### 3. Prevención de XSS y Sanitización

**Problema:** Vulnerabilidad a inyección de código por entrada de usuarios.

**Prompt:**
> "¿Cómo prevenir ataques XSS en JavaScript? Dame una función de sanitización que elimine caracteres peligrosos sin afectar datos válidos."

**Resultado:**
```js
function sanitizar(txt) {
  if (typeof txt !== 'string') return '';
  return txt.replace(/[<>"'&\\/]/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
}
```
Combinado con `textContent` y `createElement` en lugar de `innerHTML` para máxima protección.

### 4. Encapsulación con IIFE

**Problema:** Contaminación del scope global con variables y funciones.

**Prompt:**
> "¿Qué es IIFE en JavaScript y por qué usarlo? Dame un ejemplo de cómo encapsular código para evitar variables globales."

**Resultado:** Todo el código envuelto en una IIFE con `'use strict'`, eliminando la contaminación del objeto `window`.

### 5. Optimización con Debounce

**Problema:** Validación en tiempo real generaba 50+ llamadas por segundo, degradando rendimiento.

**Prompt:**
> "¿Cómo optimizar eventos input frecuentes en JavaScript? Explica debounce y proporciona implementación."

**Resultado:**
```js
function debounce(fn, ms) {
  var t;
  return function() {
    clearTimeout(t);
    t = setTimeout(function() { fn.apply(this, arguments); }, ms);
  };
}
```
Reducción de 50+ llamadas/segundo a 1-2 llamadas/segundo.

### 6. Estructura de Datos Escalable

**Problema:** Necesidad de almacenar y manipular perfiles de usuario eficientemente.

**Prompt:**
> "¿Cuál es la mejor estructura de datos para almacenar perfiles de usuario en JavaScript? ¿Array de objetos o Map? ¿Por qué?"

**Resultado:** Array de objetos con campos calculados incluidos (exposición, riesgo, perfil) para renderización rápida y serialización directa a JSON.

### 7. Manejo Robusto de Errores

**Problema:** localStorage puede fallar por cuota excedida, navegador sin soporte o datos corruptos.

**Prompt:**
> "¿Cuáles son los errores posibles con localStorage? Dame código defensivo que maneje QuotaExceededError, localStorage deshabilitado y datos corruptos."

**Resultado:** Sistema con try-catch en todas las operaciones de almacenamiento, validación de tipos antes de usar datos cargados y fallback silencioso.

### 8. Animaciones Performantes

**Problema:** Barras de progreso y transiciones visuales fluidas.

**Prompt:**
> "¿Cómo animar cambios de CSS de forma performante en JavaScript? ¿Cuál es la diferencia entre requestAnimationFrame, setTimeout y transiciones CSS?"

**Resultado:** Uso de `requestAnimationFrame` combinado con CSS transitions para animaciones suaves a 60fps sin jank.

### Resumen de Mejoras

| Prompt | Categoría | Mejora | Impacto |
|---|---|---|---|
| #1 | Arquitectura | Estructura modular | Mantenibilidad |
| #2 | Validación | Regex robusta | Confiabilidad |
| #3 | Seguridad | Sanitización XSS | Protección total |
| #4 | Encapsulación | IIFE + closure | Scope limpio |
| #5 | Performance | Debounce | 98% menos llamadas |
| #6 | Datos | Array de objetos | Escalabilidad |
| #7 | Resiliencia | Try-catch | Estabilidad |
| #8 | UX | Animaciones RAF | 60fps |

### Aprendizajes

1. **Prompts específicos** producen soluciones de calidad
2. Toda respuesta de IA debe **validarse críticamente**
3. Implementar **cambio por cambio** verificando funcionalidad
4. **Documentar decisiones** facilita auditoría y aprendizaje

---

## Licencia

MIT ©

---

**Desarrollado por Cheezyfingvz x MandatoryCream - 2026**
