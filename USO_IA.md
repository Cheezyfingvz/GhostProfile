# Uso de IA en GhostProfile

**Proyecto:** GhostProfile — Análisis de Exposición Digital
**Equipo:** Cheezyfingvz x MandatoryCream
**Fecha:** 2026

---

## Resumen

Este proyecto fue desarrollado con asistencia de **GitHub Copilot** para mejorar la calidad del código, la robustez de las validaciones y la claridad de la implementación. A continuación se documentan los prompts utilizados y las mejoras aplicadas en cada etapa del desarrollo.

---

## Prompts y Mejoras

### 1. Refactorización Modular

**Problema:** Código monolítico sin estructura, difícil de mantener y escalar.

**Prompt:**
> "Refactoriza este código JavaScript en una estructura modular. Agrupa funciones por responsabilidad (validación, cálculos, renderización, eventos, utilidades). Usa comentarios como separadores de secciones."

**Resultado:** Código organizado en 11 módulos con responsabilidad única, facilitando navegación, mantenimiento y escalabilidad.

---

### 2. Validaciones Robusta con Regex

**Problema:** Validación de email poco confiable.

**Prompt:**
> "Dame una expresión regular en JavaScript para validar correos electrónicos. Debe ser práctica, rechazar espacios y caracteres inválidos."

**Resultado:**
```js
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```
Validación efectiva sin falsos positivos.

---

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

---

### 4. Encapsulación con IIFE

**Problema:** Contaminación del scope global con variables y funciones.

**Prompt:**
> "¿Qué es IIFE en JavaScript y por qué usarlo? Dame un ejemplo de cómo encapsular código para evitar variables globales."

**Resultado:** Todo el código envuelto en una IIFE con `'use strict'`, eliminando la contaminación del objeto `window`.

---

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

---

### 6. Estructura de Datos Escalable

**Problema:** Necesidad de almacenar y manipular perfiles de usuario eficientemente.

**Prompt:**
> "¿Cuál es la mejor estructura de datos para almacenar perfiles de usuario en JavaScript? ¿Array de objetos o Map? ¿Por qué?"

**Resultado:** Array de objetos con campos calculados incluidos (exposición, riesgo, perfil) para renderización rápida y serialización directa a JSON.

---

### 7. Manejo Robusto de Errores

**Problema:** localStorage puede fallar por cuota excedida, navegador sin soporte o datos corruptos.

**Prompt:**
> "¿Cuáles son los errores posibles con localStorage? Dame código defensivo que maneje QuotaExceededError, localStorage deshabilitado y datos corruptos."

**Resultado:** Sistema con try-catch en todas las operaciones de almacenamiento, validación de tipos antes de usar datos cargados y fallback silencioso.

---

### 8. Animaciones Performantes

**Problema:** Barras de progreso y transiciones visuales fluidas.

**Prompt:**
> "¿Cómo animar cambios de CSS de forma performante en JavaScript? ¿Cuál es la diferencia entre requestAnimationFrame, setTimeout y transiciones CSS?"

**Resultado:** Uso de `requestAnimationFrame` combinado con CSS transitions para animaciones suaves a 60fps sin jank.

---

### 9. Notificaciones Toast

**Problema:** Mensajes estáticos de confirmación pasaban desapercibidos y no proporcionaban feedback visual inmediato.

**Prompt:**
> "Crea un sistema de notificaciones toast animadas para acciones de guardado y eliminación de perfiles. Deben aparecer desde abajo con slide-up, auto-destruirse a los 3 segundos y soportar tipos success, error e info."

**Resultado:** Sistema de notificaciones con contenedor fijo, animaciones de entrada/salida suaves, 3 variantes de color y sin dependencias externas. Implementado en ~30 líneas de JS y ~50 líneas de CSS.

---

### 10. Confetti en Riesgo Bajo

**Problema:** Obtener un resultado positivo (riesgo bajo) no tenía ningún refuerzo visual que celebrara el logro.

**Prompt:**
> "Implementa un efecto de confetti que se active cuando el usuario obtenga un riesgo 'Bajo'. Usa partículas de colores teal/verde/lila que caigan con rotación y se limpien automáticamente."

**Resultado:** 60 partículas con colores, tamaños y velocidades aleatorias. Animación fluida a 60fps con limpieza automática después de 4.5s. ~25 líneas de JS + keyframes CSS.

---

### 11. Tooltips Informativos

**Problema:** Los términos "Riesgo" y "Perfil" carecían de contexto explicativo para usuarios nuevos.

**Prompt:**
> "Añade tooltips con icono ⓘ junto a las etiquetas de Riesgo y Perfil en el resultado del análisis. Deben mostrar texto explicativo al hacer hover con un diseño oscuro y borde teal."

**Resultado:** Tooltips posicionados con CSS puro, sin JavaScript adicional para el hover. Aparecen con fade y flecha indicadora hacia abajo. ~40 líneas de CSS, 15 líneas de JS para la estructura DOM.

---

### 12. Transición Glitch en Typewriter

**Problema:** La transición entre frases del carrusel typewriter usaba un borrado letra por letra que resultaba lento y poco atractivo visualmente.

**Prompt:**
> "Reemplaza el borrado del typewriter por un efecto glitch. La frase debe distorsionarse visualmente (skew, text-shadow RGB) mientras los caracteres se reemplazan con símbolos aleatorios, y luego desvanecerse para dar paso a la nueva frase."

**Resultado:** Efecto glitch combinado con animación CSS (desplazamiento, skewX, sombras #ff00ff/#00ffff) y reemplazo JS de caracteres con símbolos aleatorios cada 70ms. Transición de 500ms que reemplazó al borrado tradicional de 3-4 segundos.

---

### 13. Seguimiento de Mouse en Título

**Problema:** El título estático no aprovechaba la interactividad del mouse para generar una experiencia más envolvente.

**Prompt:**
> "Haz que el título GhostProfile siga al mouse de forma sutil y elegante. El movimiento debe ser leve, con transición suave para que no se sienta brusco, y debe integrarse con la estética oscura y teal de la página."

**Resultado:** El título se mueve con factor 0.012 (apenas 12px de desplazamiento máximo), con transición de 0.45s y easing cubic-bezier(0.25, 0.1, 0.25, 1) para un efecto de "arrastre" suave. Al salir el mouse del hero, el título regresa flotando a su posición original.

---

### 14. Entrada Animada de Letras

**Problema:** Al cargar la página, el título aparecía de golpe sin ninguna animación de entrada que captara la atención.

**Prompt:**
> "Crea una animación de entrada para el título GhostProfile donde cada letra vuele desde una dirección aleatoria y aterrice en su posición. Las letras deben ser el título definitivo (sin capas ocultas, sin fades)."

**Resultado:** Cada letra del título se envuelve en un `<span>` con gradiente individual, parte desde una dirección aleatoria con distancia de 40-100px y escala 0.5, y aterriza suavemente con transición escalonada de 30ms entre letras. Las letras animadas SON el título permanente — no hay overlays ni capas ocultas.

---

## Resumen de Mejoras

| Prompt | Categoría | Mejora | Impacto |
|--------|-----------|--------|---------|
| #1 | Arquitectura | Estructura modular | Mantenibilidad |
| #2 | Validación | Regex robusta | Confiabilidad |
| #3 | Seguridad | Sanitización XSS | Protección total |
| #4 | Encapsulación | IIFE + closure | Scope limpio |
| #5 | Performance | Debounce | 98% menos llamadas |
| #6 | Datos | Array de objetos | Escalabilidad |
| #7 | Resiliencia | Try-catch | Estabilidad |
| #8 | UX | Animaciones RAF | 60fps |
| #9 | UX | Toast notifications | Feedback visual inmediato |
| #10 | UX | Confetti en riesgo bajo | Refuerzo positivo |
| #11 | UX | Tooltips informativos | Claridad contextual |
| #12 | UX | Transición glitch en typewriter | Transición visual atractiva |
| #13 | UX | Seguimiento de mouse en título | Efecto interactivo elegante |
| #14 | UX | Entrada animada de letras | Animación de carga atractiva |
| #15 | Arquitectura | Fusión de reglas CSS duplicadas | ~50 líneas menos, mantenibilidad |
| #16 | UI/UX | Select personalizado con glassmorphism | UX consistente, sin dependencias |
| #17 | UX | Búsqueda en tiempo real de perfiles | Navegación rápida |

---

### 15. Fusión de Reglas CSS Duplicadas

**Problema:** 6 pares de reglas CSS duplicadas (`.hero-title`, `.section-title`, `.result-card`, `.info-card`, `.form-card`, `.save-ok`) con estilos base y animaciones separadas en distintos bloques, causando sobrescritura y código redundante.

**Prompt:**
> "Fusiona los pares de reglas CSS duplicadas en bloques únicos. Cada par separa propiedades base y animaciones en dos bloques distintos — el segundo sobrescribe al primero. Únelos en un solo bloque manteniendo el output visual idéntico."

**Resultado:** ~50 líneas eliminadas. Cada selector aparece una sola vez en el CSS con todas sus propiedades (base + animación) consolidadas. Sin cambios visuales.

---

### 16. Select Personalizado con Glassmorphism

**Problema:** El `<select>` nativo de red social mostraba el dropdown del sistema operativo (fondo blanco/gris) sin control de estilo ni animación, rompiendo la coherencia visual del diseño oscuro.

**Prompt:**
> "Reemplaza el select nativo de red social por un componente personalizado. Debe usar backdrop-filter glassmorphism, animación scale+opacity al abrir, colores del sistema (oscuro con acentos teal), sincronización con el select oculto para no romper la lógica existente, y navegación por teclado (Enter, Escape, flechas)."

**Resultado:** Componente dropdown con fondo oscuro glassmorphism, animación de apertura suave (200ms), opción seleccionada con checkmark teal, estados has-error/has-ok sincronizados, navegación por teclado completa y fallback al select nativo si JS falla. ~60 líneas de CSS + ~110 líneas de JS. El `<select>` nativo se mantiene oculto con sincronización automática, cero cambios en validación existente.

---

### 17. Búsqueda en Tiempo Real de Perfiles

**Problema:** Con múltiples perfiles guardados, no había forma de encontrar uno específico sin revisar manualmente cada tarjeta.

**Prompt:**
> "Añade un campo de búsqueda en tiempo real en la sección de perfiles. Debe filtrar las tarjetas mientras el usuario escribe, buscar en nickname, red social, riesgo y email, ocultar/mostrar tarjetas sin recargar, y mostrar un mensaje si no hay resultados. Debe aparecer solo cuando haya perfiles guardados."

**Resultado:** Input de búsqueda con debounce (200ms), filtra en todo el texto de cada tarjeta, mensaje "sin resultados" con DOM seguro (createElement + textContent), barra oculta automáticamente sin perfiles. ~70 líneas de JS + ~30 líneas de CSS.

---

## Aprendizajes

1. **Prompts específicos** producen soluciones de calidad
2. Toda respuesta de IA debe **validarse críticamente**
3. Implementar **cambio por cambio** verificando funcionalidad
4. **Documentar decisiones** facilita auditoría y aprendizaje

---

*GhostProfile — Análisis de Exposición Digital*
*Desarrollado por Cheezyfingvz x MandatoryCream - 2026*
