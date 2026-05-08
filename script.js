/**
 * GhostProfile - Análisis de Exposición Digital
 * 
 * SECCIÓN: USO DE INTELIGENCIA ARTIFICIAL
 * ========================================
 * Este código fue desarrollado con apoyo de IA para:
 * 1. Refactorización modular: Estructura de funciones reutilizables y escalables
 * 2. Validaciones robustas: Regex avanzadas para email, teléfono, caracteres especiales
 * 3. Prevención de XSS: Implementación de sanitización y uso de textContent/createElement
 * 4. Patrones de diseño: Módulos IIFE para encapsulación y evitar contaminación global
 * 5. Manejo de errores y edge cases en validación de datos
 * 
 * Mejoras implementadas:
 * - Validación semántica completa con mensajes claros
 * - Gestión eficiente de datos con arrays y objetos
 * - Funciones puras y reutilizables (sanitizar, validarCorreo, calcularExposicion, etc.)
 * - Manejo seguro del DOM con creación de elementos dinámicos
 */

(function() {
  'use strict';
  
  // ============================================
  // CONSTANTES DE CONFIGURACIÓN
  // ============================================
  // Asistido por GitHub Copilot: Valores calibrados para cálculos de exposición digital realistas
  var EXP_MAX = 100;
  var MULT_EXP = 12;
  var EDAD_MIN = 13;
  var EDAD_MAX = 100;
  var HORAS_MIN = 0;
  var HORAS_MAX = 24;
  var NOMBRE_MIN = 3;
  var NUM_PARTICULAS = 65;
  var RETARDO_MS = 300;
  var ELIMINAR_MS = 320;
  var CLAVE_ALMACENAMIENTO = 'ghostProfilesData';
  
  // ============================================
  // ESTADO GLOBAL Y REFERENCIAS DOM
  // ============================================
  var perfiles = [];
  var formulario = document.getElementById('formularioPerfil');
  var inpNombre = document.getElementById('nombre');
  var inpCorreo = document.getElementById('correo');
  var inpEdad = document.getElementById('edad');
  var inpRed = document.getElementById('redSocial');
  var inpHoras = document.getElementById('horas');
  var secResultado = document.getElementById('seccionResultado');
  var divResultado = document.getElementById('resultadoContenido');
  var divTarjetas = document.getElementById('contenedorTarjetas');
  var pVacio = document.getElementById('msgVacio');
  var secPerfiles = document.getElementById('seccion-perfiles');
  var insigniaConteo = document.getElementById('insigniaConteo');
  var statsPerfiles = document.getElementById('statsPerfiles');
  
  // ============================================
  // MÓDULO: UTILIDADES GENERALES
  // ============================================
  /**
   * Genera un ID único usando timestamp y números aleatorios
   * Propósito: Crear identificadores únicos para cada perfil analizado
   */
  function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
  
  /**
   * Implementa debouncing para optimizar rendimiento en eventos
   * Asistido por GitHub Copilot: Patrón recomendado para reducir llamadas a funciones frecuentes
   * Propósito: Mejorar performance en validación en tiempo real sin saturar ejecuciones
   */
  function debounce(fn, ms) {
    var temporizador;
    return function() {
      var argumentos = arguments;
      var contexto = this;
      clearTimeout(temporizador);
      temporizador = setTimeout(function() { fn.apply(contexto, argumentos); }, ms);
    };
  }
  
  /**
   * Formatea fecha ISO a formato legible en español
   * Propósito: Mostrar fechas de creación de perfiles de forma amigable al usuario
   */
  function formatearFecha(iso) {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  
  /**
   * Vacía completamente un elemento DOM
   * Propósito: Limpiar contenedores antes de renderizar nuevos datos
   * Beneficio: Evita duplicación de elementos y garantiza actualización limpia
   */
  function vaciar(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
  
  // ============================================
  // MÓDULO: SEGURIDAD Y SANITIZACIÓN
  // ============================================
  /**
   * Asistido por GitHub Copilot: Función de sanitización robusta contra XSS
   * Elimina caracteres peligrosos y secuencias de control
   * Propósito: Prevenir inyección de código malicioso a través de inputs de usuario
   * Técnicas implementadas:
   * - Eliminación de caracteres HTML: <>"'&\/
   * - Eliminación de caracteres de control (0x00-0x1F, 0x7F)
   * - Trim de espacios en blanco
   * IMPORTANTE: Usar con textContent/createElement para máxima seguridad
   */
  function sanitizar(txt) {
    if (typeof txt !== 'string') return '';
    // Remueve caracteres potencialmente peligrosos
    return txt.replace(/[<>"'&\\/]/g, '')
              .replace(/[\x00-\x1F\x7F]/g, '')
              .trim();
  }
  
  // ============================================
  // MÓDULO: VALIDACIONES AVANZADAS
  // ============================================
  /**
   * Asistido por GitHub Copilot: Validación robusta de email con expresión regular
   * Regex basada en estándares RFC simplificados para uso práctico
   * Valida: nombre@dominio.extensión
   */
  function validarCorreo(e) {
    // Regex básica pero efectiva: [usuarios]@[dominio].[extensión]
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }
  
  /**
   * Valida que un valor esté dentro de un rango numérico
   * Propósito: Verificar que edad y horas estén en rangos permitidos
   */
  function validarRango(v, min, max) {
    var n = Number(v);
    return !isNaN(n) && n >= min && n <= max;
  }
  
  /**
   * Asistido por GitHub Copilot: Validación completa de entrada del formulario
   * Valida todos los campos con reglas semánticas y rango
   * Retorna: { ok: boolean, errores: [{ c: campo, m: mensaje }] }
   * Propósito: Centralizar lógica de validación y retornar errores estructurados
   * Beneficio: Fácil de mantener y escalar con nuevos campos
   */
  function validarEntrada(d) {
    var errores = [];
    
    // Validación de nombre/nickname
    if (!d.nombre) {
      errores.push({ campo: 'nombre', mensaje: 'El nickname es obligatorio' });
    } else if (d.nombre.length < NOMBRE_MIN) {
      errores.push({ campo: 'nombre', mensaje: 'Minimo 3 caracteres' });
    }
    
    // Validación de email
    if (!d.correo) {
      errores.push({ campo: 'correo', mensaje: 'El correo es obligatorio' });
    } else if (!validarCorreo(d.correo)) {
      errores.push({ campo: 'correo', mensaje: 'Formato de correo no válido' });
    }
    
    // Validación de edad
    if (d.edad === '' || d.edad === null || d.edad === undefined) {
      errores.push({ campo: 'edad', mensaje: 'La edad es obligatoria' });
    } else if (!validarRango(d.edad, EDAD_MIN, EDAD_MAX)) {
      errores.push({ campo: 'edad', mensaje: 'Edad entre 13 y 100' });
    }
    
    // Validación de red social
    if (!d.redSocial) {
      errores.push({ campo: 'redSocial', mensaje: 'Selecciona una red social' });
    }
    
    // Validación de horas de uso
    if (d.horas === '' || d.horas === null || d.horas === undefined) {
      errores.push({ campo: 'horas', mensaje: 'Las horas son obligatorias' });
    } else if (!validarRango(d.horas, HORAS_MIN, HORAS_MAX)) {
      errores.push({ campo: 'horas', mensaje: 'Horas entre 0 y 24' });
    }
    
    return { ok: errores.length === 0, errores: errores };
  }
  
  // ============================================
  // MÓDULO: CÁLCULOS DE EXPOSICIÓN
  // ============================================
  /**
   * Calcula el índice de exposición digital basado en horas de uso
   * Fórmula: exposicion = min(horas * 12, 100)
   * Rango: 0-100 (representación porcentual)
   */
  function calcularExposicion(h) {
    return Math.min(h * MULT_EXP, EXP_MAX);
  }
  
  /**
   * Clasifica el riesgo según horas de uso diario
   * Criterios:
   * - Bajo: 0-2 horas
   * - Medio: 2.1-5 horas
   * - Alto: 5+ horas
   */
  function calcularRiesgo(h) {
    if (h <= 1) return 'Bajo';
    if (h <= 3) return 'Medio-Bajo';
    if (h <= 5) return 'Medio';
    if (h <= 7) return 'Medio-Alto';
    return 'Muy Alto';
  }
  
  /**
   * Determina el perfil de usuario basado en nivel de riesgo
   * Propósito: Categorizar al usuario en un tipo de consumidor digital
   */
  function calcularPerfil(r) {
    if (r === 'Bajo') return 'Usuario Casual';
    if (r === 'Medio-Bajo') return 'Navegador Moderado';
    if (r === 'Medio') return 'Consumidor Activo';
    if (r === 'Medio-Alto') return 'Usuario Dependiente';
    return 'Extrema Dependencia Digital';
  }
  
  /**
   * Convierte riesgo a clase CSS para estilos visuales
   * Propósito: Aplicar colores y estilos diferentes según nivel de riesgo
   */
  function claseRiesgo(r) {
    if (r === 'Medio-Bajo') return 'medio-bajo';
    if (r === 'Medio') return 'medio';
    if (r === 'Medio-Alto') return 'medio-alto';
    if (r === 'Muy Alto') return 'muy-alto';
    return 'bajo';
  }
  
  /**
   * Genera recomendación personalizada según nivel de riesgo
   * Propósito: Proporcionar guidance útil al usuario basado en análisis
   */
  function obtenerRecomendacion(r) {
    if (r === 'Bajo') {
      return 'Tu exposición digital es saludable. Mantén tus hábitos actuales y sé consciente de tu tiempo en pantalla.';
    }
    if (r === 'Medio-Bajo') {
      return 'Tu uso de redes sociales es moderado. Monitorea tu tiempo para evitar que aumente y establece horarios libres de pantalla.';
    }
    if (r === 'Medio') {
      return 'Tu nivel de uso es moderado. Considera establecer límites de tiempo y realizar pausas regulares durante el uso de redes.';
    }
    if (r === 'Medio-Alto') {
      return 'Tu dependencia digital es elevada. Reduce gradualmente tus horas de conexión y prioriza actividades al aire libre.';
    }
    return 'Tu dependencia digital es crítica. Reduce gradualmente tus horas de uso y busca actividades offline que disfrutes.';
  }
  
  // ============================================
  // MÓDULO: GESTIÓN DE PERFILES (CRUD)
  // ============================================
  /**
   * Agrega un nuevo perfil al array y guarda en localStorage
   * Propósito: Persistir datos de análisis del usuario
   */
  function agregarPerfil(p) {
    perfiles.push(p);
    guardar();
  }
  
  /**
   * Elimina un perfil por ID con animación
   * Propósito: Permitir al usuario remover análisis anteriores
   * Proceso: Anima, espera, elimina del array, guarda, re-renderiza
   */
  function eliminarPerfil(id) {
    var elemento = divTarjetas.querySelector('[data-id="' + id + '"]');
    if (!elemento) return;
    
    elemento.classList.add('removing');
    setTimeout(function() {
      var indice = perfiles.findIndex(function(p) { return p.id === id; });
      if (indice !== -1) {
        perfiles.splice(indice, 1);
        guardar();
        mostrarTarjetas();
      }
    }, ELIMINAR_MS);
  }
  
  /**
   * Guarda array de perfiles en localStorage
   * Asistido por GitHub Copilot: Manejo de errores para localStorage con try-catch
   * Propósito: Persistencia de datos entre sesiones del usuario
   */
  function guardar() {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(perfiles));
    } catch (e) {
      console.error('Error guardando datos en localStorage:', e);
    }
  }
  
  /**
   * Carga perfiles desde localStorage al iniciar
   * Asistido por GitHub Copilot: Validación de datos JSON y tipo de array
   * Propósito: Restaurar datos de sesiones anteriores
   */
  function cargar() {
    try {
      var datosCrudos = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (!datosCrudos) return;
      
      var datos = JSON.parse(datosCrudos);
      if (Array.isArray(datos)) {
        perfiles.length = 0;
        for (var i = 0; i < datos.length; i++) {
          var p = datos[i];
          // Migrar al nuevo sistema de 5 niveles
          var nuevoRiesgo = calcularRiesgo(p.horas);
          p.riesgo = nuevoRiesgo;
          p.perfil = calcularPerfil(nuevoRiesgo);
          perfiles.push(p);
        }
        mostrarTarjetas();
      }
    } catch (e) {
      console.error('Error cargando datos de localStorage:', e);
    }
  }
  
  // ============================================
  // MÓDULO: GESTIÓN DE ERRORES EN FORMULARIO
  // ============================================
  /**
   * Muestra error en campo específico
   * Propósito: Feedback visual inmediato al usuario sobre validación fallida
   * Accesibilidad: Actualiza aria-invalid y aria-describedby
   */
  function mostrarError(campo, msg) {
    var entrada = document.getElementById(campo);
    var spanError = document.getElementById('error-' + campo);
    
    if (entrada) {
      entrada.classList.add('has-error');
      entrada.classList.remove('has-ok');
      entrada.setAttribute('aria-invalid', 'true');
    }
    if (spanError) {
      spanError.textContent = msg;
      spanError.classList.add('show');
    }
  }
  
  function limpiarError(campo) {
    var entrada = document.getElementById(campo);
    var spanError = document.getElementById('error-' + campo);
    
    if (entrada) {
      entrada.classList.remove('has-error');
      entrada.setAttribute('aria-invalid', 'false');
    }
    if (spanError) {
      spanError.textContent = '';
      spanError.classList.remove('show');
    }
  }
  
  /**
   * Limpia TODOS los errores del formulario
   * Propósito: Reset de estado visual al inicializar validación
   */
  function limpiarTodosErrores() {
    var campos = ['nombre', 'correo', 'edad', 'redSocial', 'horas'];
    for (var i = 0; i < campos.length; i++) {
      limpiarError(campos[i]);
    }
  }
  
  /**
   * Marca campo como válido visualmente
   * Propósito: Feedback positivo cuando validación pasa
   */
  function marcarOk(campo) {
    var entrada = document.getElementById(campo);
    if (entrada && !entrada.classList.contains('has-error')) {
      entrada.classList.add('has-ok');
    }
  }
  
  // ============================================
  // MÓDULO: RENDERIZACIÓN DEL DOM
  // ============================================
  /**
   * Crea barra de progreso visual (progress bar) para exposición
   * Asistido por GitHub Copilot: Animación con requestAnimationFrame para fluidez
   * Propósito: Visualizar numéricamente el nivel de exposición digital
   */
  function crearBarra(valor, riesgo) {
    var contenedor = document.createElement('div');
    contenedor.className = 'pbar';
    
    var relleno = document.createElement('div');
    relleno.className = 'pbar-fill ' + claseRiesgo(riesgo);
    relleno.style.width = '0%';
    
    var texto = document.createElement('span');
    texto.className = 'pbar-text';
    texto.textContent = '0%';  // Arranca en 0
    
    contenedor.appendChild(relleno);
    contenedor.appendChild(texto);
    
    // Animar ancho y contador con RAF
    requestAnimationFrame(function() {
      setTimeout(function() {
        relleno.style.width = valor + '%';
        animarContador(texto, valor, '%');
      }, 60);
    });
    
    return contenedor;
  }
  
  /**
   * Renderiza el listado de tarjetas de perfiles analizados
   * Propósito: Mostrar todos los análisis guardados de forma visual
   * Reutilizable: Se llama cada vez que cambios el estado de perfiles
   */
  function mostrarTarjetas() {
    vaciar(divTarjetas);
    
    // Actualizar contador de perfiles
    insigniaConteo.textContent = perfiles.length + ' perfil' + (perfiles.length !== 1 ? 'es' : '');
    insigniaConteo.classList.remove('hidden');
    
    if (perfiles.length === 0) {
      pVacio.classList.remove('hidden');
      insigniaConteo.classList.add('hidden');
      statsPerfiles.classList.add('hidden');
      return;
    }
    
    pVacio.classList.add('hidden');
    
    // Renderizar stats
    mostrarEstadisticas();
    
    // Renderizar tarjetas
    for (var i = 0; i < perfiles.length; i++) {
      divTarjetas.appendChild(crearTarjeta(perfiles[i]));
    }
  }
  
  function mostrarEstadisticas() {
    vaciar(statsPerfiles);
    statsPerfiles.classList.remove('hidden');
    
    var total = perfiles.length;
    var sumaExp = 0;
    var conteoAlto = 0;
    
    for (var i = 0; i < perfiles.length; i++) {
      sumaExp += perfiles[i].exposicion;
      if (perfiles[i].riesgo === 'Muy Alto') conteoAlto++;
    }
    
    var promedioExp = Math.round(sumaExp / total);
    
    var estadisticas = [
      { icon: '\uD83D\uDCCA', valor: total, etiqueta: 'Total Perfiles' },
      { icon: '\uD83C\uDFAF', valor: promedioExp + '%', etiqueta: 'Exposicion Promedio' },
      { icon: '\u26A0', valor: conteoAlto, etiqueta: 'Riesgo Muy Alto' }
    ];
    
    for (var i = 0; i < estadisticas.length; i++) {
      var elemento = document.createElement('div');
      elemento.className = 'stat-item';
      
      var icono = document.createElement('span');
      icono.className = 'stat-icon';
      icono.textContent = estadisticas[i].icon;
      
      var valor = document.createElement('span');
      valor.className = 'stat-value';
      valor.textContent = estadisticas[i].valor;
      
      var etiqueta = document.createElement('span');
      etiqueta.className = 'stat-label';
      etiqueta.textContent = estadisticas[i].etiqueta;
      
      elemento.appendChild(icono);
      elemento.appendChild(valor);
      elemento.appendChild(etiqueta);
      statsPerfiles.appendChild(elemento);
    }
  }
  
  /**
   * Asistido por GitHub Copilot: Crea tarjeta individual de perfil analizado
   * Propósito: Componente reutilizable que construye DOM de forma segura
   * Técnica: Usa createElement + textContent (NO innerHTML) para evitar XSS
   * Retorna: elemento <article> con estructura completa del perfil
   */
  function crearTarjeta(p) {
    var tarjeta = document.createElement('article');
    tarjeta.className = 'pcard';
    tarjeta.setAttribute('data-id', p.id);
    
    // Encabezado con nombre y fecha
    var encabezado = document.createElement('div');
    encabezado.className = 'pcard-head';
    
    var titulo = document.createElement('h3');
    titulo.textContent = p.nombre;  // Seguro: textContent previene XSS
    
    var fecha = document.createElement('span');
    fecha.className = 'pcard-date';
    fecha.textContent = formatearFecha(p.fechaCreacion);
    
    encabezado.appendChild(titulo);
    encabezado.appendChild(fecha);
    
    // Sección de datos del perfil
    var datos = document.createElement('div');
    datos.className = 'pcard-data';
    
    var items = [
      { etiqueta: 'Email', valor: p.correo, icono: '\u2709\uFE0F' },
      { etiqueta: 'Edad', valor: p.edad + ' años', icono: '\uD83C\uDF82' },
      { etiqueta: 'Red', valor: p.redSocial, icono: '\u2B50' },
      { etiqueta: 'Uso diario', valor: p.horas + 'h', icono: '\u23F0' }
    ];
    
    for (var i = 0; i < items.length; i++) {
      var elemento = document.createElement('div');
      elemento.className = 'ditem';
      
      var etiquetaItem = document.createElement('span');
      etiquetaItem.className = 'ditem-l';
      etiquetaItem.textContent = items[i].icono + ' ' + items[i].etiqueta;
      
      var valorItem = document.createElement('span');
      valorItem.className = 'ditem-v';
      valorItem.textContent = items[i].valor;
      
      elemento.appendChild(etiquetaItem);
      elemento.appendChild(valorItem);
      datos.appendChild(elemento);
    }
    
    // Sección de exposición digital
    var seccionExp = document.createElement('div');
    seccionExp.className = 'pcard-exp';
    
    var etiquetaExp = document.createElement('span');
    etiquetaExp.className = 'label';
    etiquetaExp.textContent = 'Exposición Digital';
    
    seccionExp.appendChild(etiquetaExp);
    seccionExp.appendChild(crearBarra(p.exposicion, p.riesgo));
    
    // Clasificación y riesgo
    var clasificacion = document.createElement('div');
    clasificacion.className = 'pcard-res';
    
    var insignia = document.createElement('span');
    insignia.className = 'badge ' + claseRiesgo(p.riesgo);
    insignia.textContent = 'Riesgo: ' + p.riesgo;
    
    if (p.riesgo === 'Muy Alto') {
      var iconoAlarma = document.createElement('span');
      iconoAlarma.className = 'alarm-icon';
      iconoAlarma.textContent = '\uD83D\uDD14';
      insignia.appendChild(iconoAlarma);
    }
    
    var tipoPerfil = document.createElement('span');
    tipoPerfil.className = 'perfil-type';
    tipoPerfil.textContent = p.perfil;
    
    clasificacion.appendChild(insignia);
    clasificacion.appendChild(tipoPerfil);
    
    // Botón de eliminar
    var boton = document.createElement('button');
    boton.className = 'btn-del';
    boton.textContent = 'Eliminar perfil';
    boton.setAttribute('aria-label', 'Eliminar perfil de ' + p.nombre);
    boton.addEventListener('click', function() { eliminarPerfil(p.id); });
    
    tarjeta.appendChild(encabezado);
    tarjeta.appendChild(datos);
    tarjeta.appendChild(seccionExp);
    tarjeta.appendChild(clasificacion);
    tarjeta.appendChild(boton);
    
    return tarjeta;
  }
  
  /**
   * Renderiza sección de resultado después de análisis
   * Propósito: Mostrar análisis detallado del perfil creado recientemente
   * Seguridad: TODO el contenido usa textContent, NO innerHTML
   */
  function mostrarResultado(p) {
    vaciar(divResultado);
    divResultado.setAttribute('tabindex', '-1');
    
    var encabezado = document.createElement('div');
    encabezado.className = 'res-head';
    
    var titulo = document.createElement('h3');
    titulo.textContent = 'Resultado del Analisis';
    
    var subtitulo = document.createElement('span');
    subtitulo.textContent = 'para ' + p.nombre;
    
    encabezado.appendChild(titulo);
    encabezado.appendChild(subtitulo);
    
    // Métricas del análisis
    var metricas = document.createElement('div');
    metricas.className = 'res-metrics';
    
    var itemsMetricas = [
      ['Red Social', p.redSocial],
      ['Uso Diario', p.horas + 'h'],
      ['Edad', p.edad + ' anos']
    ];
    
    for (var i = 0; i < itemsMetricas.length; i++) {
      var metrica = document.createElement('div');
      metrica.className = 'met';
      
      var etiquetaMet = document.createElement('span');
      etiquetaMet.className = 'met-label';
      etiquetaMet.textContent = itemsMetricas[i][0];
      
      var valorMet = document.createElement('span');
      valorMet.className = 'met-val';
      valorMet.textContent = itemsMetricas[i][1];
      
      metrica.appendChild(etiquetaMet);
      metrica.appendChild(valorMet);
      metricas.appendChild(metrica);
    }
    
    // Barra de exposición
    var seccionExp = document.createElement('div');
    seccionExp.className = 'res-exp';
    
    var etiquetaExp = document.createElement('span');
    etiquetaExp.className = 'label';
    etiquetaExp.textContent = 'Exposicion Digital';
    
    seccionExp.appendChild(etiquetaExp);
    seccionExp.appendChild(crearBarra(p.exposicion, p.riesgo));
    
    // Clasificación de riesgo y perfil
    var clasificacion = document.createElement('div');
    clasificacion.className = 'res-class';
    
    var insignia = document.createElement('span');
    insignia.className = 'badge ' + claseRiesgo(p.riesgo);
    insignia.textContent = 'Riesgo ' + p.riesgo;
    
    if (p.riesgo === 'Muy Alto') {
      var iconoAlarma = document.createElement('span');
      iconoAlarma.className = 'alarm-icon';
      iconoAlarma.textContent = '\uD83D\uDD14';
      insignia.appendChild(iconoAlarma);
    }
    
    var tipoPerfil = document.createElement('span');
    tipoPerfil.className = 'perfil-type';
    tipoPerfil.textContent = p.perfil;
    
    clasificacion.appendChild(insignia);
    clasificacion.appendChild(tipoPerfil);
    
    // Recomendación personalizada
    var recomendacion = document.createElement('p');
    recomendacion.className = 'res-rec';
    recomendacion.textContent = obtenerRecomendacion(p.riesgo);
    
    // Mensaje de confirmación
    var mensajeGuardado = document.createElement('span');
    mensajeGuardado.className = 'save-ok';
    mensajeGuardado.textContent = 'Perfil guardado correctamente';
    
    divResultado.appendChild(encabezado);
    divResultado.appendChild(metricas);
    divResultado.appendChild(seccionExp);
    divResultado.appendChild(clasificacion);
    divResultado.appendChild(recomendacion);
    divResultado.appendChild(mensajeGuardado);
    
    secResultado.classList.remove('hidden');
  }
  
  // ============================================
  // MÓDULO: PROCESAMIENTO DE FORMULARIO
  // ============================================
  /**
   * Extrae y sanitiza datos del formulario
   * Propósito: Obtener valores limpios y seguros del usuario
   * Retorna: objeto con datos sanitizados y parseados
   */
  function extraerDatos() {
    return {
      nombre: sanitizar(inpNombre.value),
      correo: sanitizar(inpCorreo.value),
      edad: parseInt(inpEdad.value, 10),
      redSocial: sanitizar(inpRed.value),
      horas: parseFloat(inpHoras.value)
    };
  }
  
  /**
   * Limpia y resetea el formulario completamente
   * Propósito: Preparar formulario para nuevo análisis después de guardar
   */
  function limpiarForm() {
    formulario.reset();
    limpiarTodosErrores();
    
    var campos = ['nombre', 'correo', 'edad', 'redSocial', 'horas'];
    for (var i = 0; i < campos.length; i++) {
      var elemento = document.getElementById(campos[i]);
      if (elemento) elemento.classList.remove('has-ok', 'has-error');
    }
  }
  
  // ============================================
  // MÓDULO: MANEJADORES DE EVENTOS
  // ============================================
  /**
   * Asistido por GitHub Copilot: Manejador principal del envío de formulario
   * Propósito: Orquestar el flujo completo de validación, análisis y guardado
   * Proceso:
   * 1. Prevenir envío por defecto
   * 2. Validar entrada
   * 3. Mostrar errores si es necesario
   * 4. Calcular exposición y perfiles
   * 5. Guardar y renderizar resultados
   * 6. Limpiar y scrollear a sección de resultados
   */
  function manejarEnvio(e) {
    e.preventDefault();
    limpiarTodosErrores();
    
    // Extraer y validar datos
    var datos = extraerDatos();
    var resultado = validarEntrada(datos);
    
    if (!resultado.ok) {
      // Mostrar todos los errores de validación
      for (var i = 0; i < resultado.errores.length; i++) {
        mostrarError(resultado.errores[i].campo, resultado.errores[i].mensaje);
      }
      return;
    }
    
    // Feedback visual: deshabilitar botón mientras se procesa
    var boton = formulario.querySelector('.btn-submit');
    establecerCargaBoton(boton, true);
    
    // Simular procesamiento con pequeña demora
    setTimeout(function() {
      // Calcular métricas de exposición
      var exposicion = calcularExposicion(datos.horas);
      var nivelRiesgo = calcularRiesgo(datos.horas);
      var tipoPerfil = calcularPerfil(nivelRiesgo);
      
      // Crear objeto de perfil
      var perfil = {
        id: generarId(),
        nombre: datos.nombre,
        correo: datos.correo,
        edad: datos.edad,
        redSocial: datos.redSocial,
        horas: datos.horas,
        exposicion: Math.round(exposicion),
        riesgo: nivelRiesgo,
        perfil: tipoPerfil,
        fechaCreacion: new Date().toISOString()
      };
      
      // Guardar y mostrar resultado
      agregarPerfil(perfil);
      mostrarResultado(perfil);
      limpiarForm();
      
      // Restaurar botón
      establecerCargaBoton(boton, false);
      
      // Renderizar tarjetas y luego scroll a resultados
      mostrarTarjetas();
      setTimeout(function() {
        if (secResultado) {
          secResultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }, 350);
  }
  
  // ============================================
  // MÓDULO: VALIDACIÓN EN TIEMPO REAL
  // ============================================
  /**
   * Validación en tiempo real para email
   * Propósito: Feedback inmediato mientras el usuario escribe
   */
  function vcCorreo() {
    var v = inpCorreo.value.trim();
    if (!v) {
      limpiarError('correo');
      return;
    }
    if (validarCorreo(v)) {
      limpiarError('correo');
      marcarOk('correo');
    } else {
      mostrarError('correo', 'Formato de correo no valido');
    }
  }
  
  /**
   * Validación en tiempo real para nombre/nickname
   */
  function vcNombre() {
    var v = inpNombre.value.trim();
    if (!v) {
      limpiarError('nombre');
      return;
    }
    
    if (v.length >= NOMBRE_MIN) {
      limpiarError('nombre');
      marcarOk('nombre');
    } else {
      mostrarError('nombre', 'Minimo 3 caracteres');
    }
  }
  
  /**
   * Validación en tiempo real para edad
   */
  function vcEdad() {
    var v = inpEdad.value;
    if (v === '') {
      limpiarError('edad');
      return;
    }
    
    if (validarRango(parseInt(v, 10), EDAD_MIN, EDAD_MAX)) {
      limpiarError('edad');
      marcarOk('edad');
    } else {
      mostrarError('edad', 'Edad entre 13 y 100');
    }
  }
  
  /**
   * Validación en tiempo real para horas
   */
  function vcHoras() {
    var v = inpHoras.value;
    if (v === '') {
      limpiarError('horas');
      return;
    }
    
    if (validarRango(parseFloat(v), HORAS_MIN, HORAS_MAX)) {
      limpiarError('horas');
      marcarOk('horas');
    } else {
      mostrarError('horas', 'Horas entre 0 y 24');
    }
  }
  
  /**
   * Validación para selección de red social
   */
  function vcRed() {
    if (inpRed.value) {
      limpiarError('redSocial');
      marcarOk('redSocial');
    } else {
      mostrarError('redSocial', 'Selecciona una red social');
    }
  }
  
  // ============================================
  // MÓDULO: INICIALIZACIÓN Y ANIMACIONES
  // ============================================
  /**
   * Genera partículas animadas de fondo
   * Propósito: Efecto visual dinámico en sección de hero
   * Técnica: Creación de divs con CSS animations y valores aleatorios
   */
  function generarParticulas() {
    var cont = document.getElementById('particulas');
    if (!cont) return;
    
    for (var i = 0; i < NUM_PARTICULAS; i++) {
      var el = document.createElement('div');
      el.className = 'dot';
      
      // Valores aleatorios para cada partícula
      var size = (Math.random() * 1.8 + 0.6).toFixed(1);
      var dur = (Math.random() * 4 + 2.5).toFixed(1);
      var ret = (Math.random() * 5).toFixed(1);
      
      el.style.left = (Math.random() * 100).toFixed(1) + '%';
      el.style.top = (Math.random() * 100).toFixed(1) + '%';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.setProperty('--d', dur + 's');
      el.style.setProperty('--r', ret + 's');
      
      cont.appendChild(el);
    }
  }
  
  // ============================================
  // MÓDULO: ANIMACIONES REVEAL AL HACER SCROLL
  // ============================================
  function observarReveal() {
    if (!('IntersectionObserver' in window)) {
      var els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      for (var i = 0; i < els.length; i++) els[i].classList.add('active');
      return;
    }

    var obs = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('active');
          obs.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    var targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    for (var i = 0; i < targets.length; i++) obs.observe(targets[i]);
  }

  // ============================================
  // MÓDULO: CONTADOR ANIMADO
  // ============================================
  function animarContador(el, target, suffix) {
    if (target === 0) { el.textContent = '0' + (suffix || ''); return; }
    var current = 0;
    var step = Math.max(1, Math.floor(target / 30));
    var dur = 600;
    var interval = Math.floor(dur / (target / step));

    var t = setInterval(function() {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(t);
      }
      el.textContent = current + (suffix || '');
    }, interval);
  }

  // ============================================
  // MÓDULO: ESTADO DE CARGA DEL BOTÓN
  // ============================================
  function establecerCargaBoton(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.classList.add('loading');
      btn.textContent = 'Analizando...';
    } else {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = 'Analizar Exposicion';
    }
  }

  // ============================================
  // MÓDULO: BARRA DE PROGRESO DE SCROLL
  // ============================================
  function iniciarProgresoScroll() {
    var barra = document.querySelector('.scroll-progress');
    if (!barra) return;

    function actualizar() {
      var desplazamiento = window.scrollY || document.documentElement.scrollTop;
      var altoDoc = document.documentElement.scrollHeight - window.innerHeight;
      var porcentaje = altoDoc > 0 ? (desplazamiento / altoDoc) * 100 : 0;
      barra.style.width = Math.min(porcentaje, 100) + '%';
    }

    window.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar, { passive: true });
    actualizar();
  }

  // ============================================
  // MÓDULO: EFECTO RIPPLE EN BOTONES
  // ============================================
  // Asistido por GitHub Copilot: Efecto de onda al hacer clic en botones
  function iniciarEfectoOnda() {
    var botones = document.querySelectorAll('.btn-submit, .btn-del');

    for (var i = 0; i < botones.length; i++) {
      botones[i].addEventListener('click', function(e) {
        if (this.disabled) return;

        var rect = this.getBoundingClientRect();
        var onda = document.createElement('span');
        onda.className = 'ripple';
        var size = Math.max(rect.width, rect.height);
        onda.style.width = onda.style.height = size + 'px';
        onda.style.left = (e.clientX - rect.left - size / 2) + 'px';
        onda.style.top = (e.clientY - rect.top - size / 2) + 'px';

        var existente = this.querySelector('.ripple');
        if (existente) existente.remove();

        this.appendChild(onda);
        this.style.position = this.style.position || 'relative';
        this.style.overflow = this.style.overflow || 'hidden';

        setTimeout(function() { if (onda.parentNode) onda.parentNode.removeChild(onda); }, 700);
      });
    }
  }

  // ============================================
  // MÓDULO: CARRUSEL TYPEWRITER
  // ============================================
  // Asistido por GitHub Copilot: Efecto de máquina de escribir con frases rotativas
  function iniciarMaquinaEscribir() {
    var elemento = document.getElementById('maquinaEscribir');
    if (!elemento) return;

    var frases = [
      'Tu tiempo vale más que un like',
      '¿Consumo o conexión?',
      '¿Cuántas horas hoy?',
      'Dejate de scrollear',
      'El detox digital es real... Y comienza hoy'
    ];

    var indice = 0;
    var indiceChar = 0;
    var borrando = false;
    var velocidad = 60;

    elemento.classList.add('typing');

    function escribir() {
      var actual = frases[indice];

      if (!borrando) {
        indiceChar++;
        elemento.textContent = actual.substring(0, indiceChar);

        if (indiceChar === actual.length) {
          setTimeout(function() { borrando = true; escribir(); }, 2500);
          return;
        }
      } else {
        indiceChar--;
        elemento.textContent = actual.substring(0, indiceChar);

        if (indiceChar === 0) {
          borrando = false;
          indice = (indice + 1) % frases.length;
          setTimeout(escribir, 400);
          return;
        }
      }

      setTimeout(escribir, borrando ? velocidad * 0.5 : velocidad);
    }

    setTimeout(escribir, 1800);
  }

  // ============================================
  // INICIALIZACIÓN: ASIGNAR EVENTOS
  // ============================================
  // Event listeners del formulario
  formulario.addEventListener('submit', manejarEnvio);
  
  // Validación en tiempo real con debounce
  inpCorreo.addEventListener('input', debounce(vcCorreo, RETARDO_MS));
  inpNombre.addEventListener('input', debounce(vcNombre, RETARDO_MS));
  inpEdad.addEventListener('input', debounce(vcEdad, RETARDO_MS));
  inpHoras.addEventListener('input', debounce(vcHoras, RETARDO_MS));
  inpRed.addEventListener('change', vcRed);
  
  // Limpiar errores al enfocar
  inpNombre.addEventListener('focus', function() { limpiarError('nombre'); });
  inpCorreo.addEventListener('focus', function() { limpiarError('correo'); });
  inpEdad.addEventListener('focus', function() { limpiarError('edad'); });
  inpHoras.addEventListener('focus', function() { limpiarError('horas'); });
  
  // Inicialización: generar partículas, animaciones reveal al hacer scroll y cargar datos guardados
  generarParticulas();
  observarReveal();
  iniciarProgresoScroll();
  iniciarEfectoOnda();
  iniciarMaquinaEscribir();
  cargar();
})();
