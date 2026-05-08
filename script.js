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
 * - Funciones puras y reutilizables (sanitizar, validarEmail, calcExposicion, etc.)
 * - Manejo seguro del DOM con creación de elementos dinámicos
 */

(function() {
  'use strict';
  
  // ============================================
  // CONSTANTES DE CONFIGURACIÓN
  // ============================================
  // AI-Assisted: Valores calibrados para cálculos de exposición digital realistas
  var EXP_MAX = 100;
  var EXP_MULT = 12;
  var EDAD_MIN = 13;
  var EDAD_MAX = 100;
  var HORAS_MIN = 0;
  var HORAS_MAX = 24;
  var NOMBRE_MIN = 3;
  var NUM_PARTICULAS = 65;
  var DEBOUNCE_MS = 300;
  var ELIM_MS = 320;
  var STORAGE_KEY = 'ghostProfilesData';
  
  // ============================================
  // ESTADO GLOBAL Y REFERENCIAS DOM
  // ============================================
  var perfiles = [];
  var formulario = document.getElementById('formPerfil');
  var inpNombre = document.getElementById('nombre');
  var inpEmail = document.getElementById('email');
  var inpEdad = document.getElementById('edad');
  var inpRed = document.getElementById('redSocial');
  var inpHoras = document.getElementById('horas');
  var secResultado = document.getElementById('seccionResultado');
  var divResultado = document.getElementById('resultadoContenido');
  var divTarjetas = document.getElementById('contenedorTarjetas');
  var pVacio = document.getElementById('msgVacio');
  var secPerfiles = document.getElementById('seccion-perfiles');
  
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
   * AI-Assisted: Patrón recomendado para reducir llamadas a funciones frecuentes
   * Propósito: Mejorar performance en validación en tiempo real sin saturar ejecuciones
   */
  function debounce(fn, ms) {
    var t;
    return function() {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  }
  
  /**
   * Formatea fecha ISO a formato legible en español
   * Propósito: Mostrar fechas de creación de perfiles de forma amigable al usuario
   */
  function fmtFecha(iso) {
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
   * AI-Assisted: Función de sanitización robusta contra XSS
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
   * AI-Assisted: Validación robusta de email con expresión regular
   * Regex basada en estándares RFC simplificados para uso práctico
   * Valida: nombre@dominio.extensión
   */
  function validarEmail(e) {
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
   * AI-Assisted: Validación completa de entrada del formulario
   * Valida todos los campos con reglas semánticas y rango
   * Retorna: { ok: boolean, errs: [{ c: campo, m: mensaje }] }
   * Propósito: Centralizar lógica de validación y retornar errores estructurados
   * Beneficio: Fácil de mantener y escalar con nuevos campos
   */
  function validarEntrada(d) {
    var errs = [];
    
    // Validación de nombre/nickname
    if (!d.nombre) {
      errs.push({ c: 'nombre', m: 'El nickname es obligatorio' });
    } else if (d.nombre.length < NOMBRE_MIN) {
      errs.push({ c: 'nombre', m: 'Minimo 3 caracteres' });
    }
    
    // Validación de email
    if (!d.email) {
      errs.push({ c: 'email', m: 'El correo es obligatorio' });
    } else if (!validarEmail(d.email)) {
      errs.push({ c: 'email', m: 'Formato de correo no valido' });
    }
    
    // Validación de edad
    if (d.edad === '' || d.edad === null || d.edad === undefined) {
      errs.push({ c: 'edad', m: 'La edad es obligatoria' });
    } else if (!validarRango(d.edad, EDAD_MIN, EDAD_MAX)) {
      errs.push({ c: 'edad', m: 'Edad entre 13 y 100' });
    }
    
    // Validación de red social
    if (!d.redSocial) {
      errs.push({ c: 'redSocial', m: 'Selecciona una red social' });
    }
    
    // Validación de horas de uso
    if (d.horas === '' || d.horas === null || d.horas === undefined) {
      errs.push({ c: 'horas', m: 'Las horas son obligatorias' });
    } else if (!validarRango(d.horas, HORAS_MIN, HORAS_MAX)) {
      errs.push({ c: 'horas', m: 'Horas entre 0 y 24' });
    }
    
    return { ok: errs.length === 0, errs: errs };
  }
  
  // ============================================
  // MÓDULO: CÁLCULOS DE EXPOSICIÓN
  // ============================================
  /**
   * Calcula el índice de exposición digital basado en horas de uso
   * Fórmula: exposicion = min(horas * 12, 100)
   * Rango: 0-100 (representación porcentual)
   */
  function calcExposicion(h) {
    return Math.min(h * EXP_MULT, EXP_MAX);
  }
  
  /**
   * Clasifica el riesgo según horas de uso diario
   * Criterios:
   * - Bajo: 0-2 horas
   * - Medio: 2.1-5 horas
   * - Alto: 5+ horas
   */
  function calcRiesgo(h) {
    if (h <= 2) return 'Bajo';
    if (h <= 5) return 'Medio';
    return 'Alto';
  }
  
  /**
   * Determina el perfil de usuario basado en nivel de riesgo
   * Propósito: Categorizar al usuario en un tipo de consumidor digital
   */
  function calcPerfil(r) {
    if (r === 'Bajo') return 'Usuario Casual';
    if (r === 'Medio') return 'Consumidor Activo';
    return 'Alta Dependencia Digital';
  }
  
  /**
   * Convierte riesgo a clase CSS para estilos visuales
   * Propósito: Aplicar colores y estilos diferentes según nivel de riesgo
   */
  function riesgoClass(r) {
    if (r === 'Medio') return 'medio';
    if (r === 'Alto') return 'alto';
    return 'bajo';
  }
  
  /**
   * Genera recomendación personalizada según nivel de riesgo
   * Propósito: Proporcionar guidance útil al usuario basado en análisis
   */
  function getRecomendacion(r) {
    if (r === 'Bajo') {
      return 'Tu exposicion digital es saludable. Manten tus habitos actuales y sigue siendo consciente de tu tiempo en pantalla.';
    }
    if (r === 'Medio') {
      return 'Tu nivel de uso es moderado. Considera establecer limites de tiempo y realizar pausas regulares durante el uso de redes.';
    }
    return 'Tu dependencia digital es elevada. Reduce gradualmente tus horas de uso y busca actividades offline que disfrutes.';
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
    var el = divTarjetas.querySelector('[data-id="' + id + '"]');
    if (!el) return;
    
    el.classList.add('removing');
    setTimeout(function() {
      var i = perfiles.findIndex(function(p) { return p.id === id; });
      if (i !== -1) {
        perfiles.splice(i, 1);
        guardar();
        renderTarjetas();
      }
    }, ELIM_MS);
  }
  
  /**
   * Guarda array de perfiles en localStorage
   * AI-Assisted: Manejo de errores para localStorage con try-catch
   * Propósito: Persistencia de datos entre sesiones del usuario
   */
  function guardar() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(perfiles));
    } catch (e) {
      console.error('Error guardando datos en localStorage:', e);
    }
  }
  
  /**
   * Carga perfiles desde localStorage al iniciar
   * AI-Assisted: Validación de datos JSON y tipo de array
   * Propósito: Restaurar datos de sesiones anteriores
   */
  function cargar() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      
      var data = JSON.parse(raw);
      if (Array.isArray(data)) {
        perfiles.length = 0;
        for (var i = 0; i < data.length; i++) {
          perfiles.push(data[i]);
        }
        renderTarjetas();
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
  function showError(campo, msg) {
    var inp = document.getElementById(campo);
    var sp = document.getElementById('error-' + campo);
    
    if (inp) {
      inp.classList.add('has-error');
      inp.classList.remove('has-ok');
      inp.setAttribute('aria-invalid', 'true');  // Indica al lector de pantalla que hay error
    }
    if (sp) {
      sp.textContent = msg;
      sp.classList.add('show');
    }
  }
  
  /**
   * Limpia error de campo específico
   * Propósito: Remover feedback de error cuando usuario corrige input
   * Accesibilidad: Resetea aria-invalid cuando se aclara error
   */
  function clearError(campo) {
    var inp = document.getElementById(campo);
    var sp = document.getElementById('error-' + campo);
    
    if (inp) {
      inp.classList.remove('has-error');
      inp.setAttribute('aria-invalid', 'false');  // Indica que el error fue corregido
    }
    if (sp) {
      sp.textContent = '';
      sp.classList.remove('show');
    }
  }
  
  /**
   * Limpia TODOS los errores del formulario
   * Propósito: Reset de estado visual al inicializar validación
   */
  function clearAllErrors() {
    var campos = ['nombre', 'email', 'edad', 'redSocial', 'horas'];
    for (var i = 0; i < campos.length; i++) {
      clearError(campos[i]);
    }
  }
  
  /**
   * Marca campo como válido visualmente
   * Propósito: Feedback positivo cuando validación pasa
   */
  function markOk(campo) {
    var inp = document.getElementById(campo);
    if (inp && !inp.classList.contains('has-error')) {
      inp.classList.add('has-ok');
    }
  }
  
  // ============================================
  // MÓDULO: RENDERIZACIÓN DEL DOM
  // ============================================
  /**
   * Crea barra de progreso visual (progress bar) para exposición
   * AI-Assisted: Animación con requestAnimationFrame para fluidez
   * Propósito: Visualizar numéricamente el nivel de exposición digital
   */
  function makeBar(valor, riesgo) {
    var wrap = document.createElement('div');
    wrap.className = 'pbar';
    
    var fill = document.createElement('div');
    fill.className = 'pbar-fill ' + riesgoClass(riesgo);
    fill.style.width = '0%';
    
    var txt = document.createElement('span');
    txt.className = 'pbar-text';
    txt.textContent = valor + '%';  // Safe: usando textContent, no innerHTML
    
    wrap.appendChild(fill);
    wrap.appendChild(txt);
    
    // Animar width con RAF para máximo rendimiento
    requestAnimationFrame(function() {
      setTimeout(function() { fill.style.width = valor + '%'; }, 60);
    });
    
    return wrap;
  }
  
  /**
   * Renderiza el listado de tarjetas de perfiles analizados
   * Propósito: Mostrar todos los análisis guardados de forma visual
   * Reutilizable: Se llama cada vez que cambios el estado de perfiles
   */
  function renderTarjetas() {
    vaciar(divTarjetas);
    
    if (perfiles.length === 0) {
      pVacio.classList.remove('hidden');
      return;
    }
    
    pVacio.classList.add('hidden');
    for (var i = 0; i < perfiles.length; i++) {
      divTarjetas.appendChild(makeCard(perfiles[i]));
    }
  }
  
  /**
   * AI-Assisted: Crea tarjeta individual de perfil analizado
   * Propósito: Componente reutilizable que construye DOM de forma segura
   * Técnica: Usa createElement + textContent (NO innerHTML) para evitar XSS
   * Retorna: elemento <article> con estructura completa del perfil
   */
  function makeCard(p) {
    var card = document.createElement('article');
    card.className = 'pcard';
    card.setAttribute('data-id', p.id);
    
    // Encabezado con nombre y fecha
    var head = document.createElement('div');
    head.className = 'pcard-head';
    
    var h3 = document.createElement('h3');
    h3.textContent = p.nombre;  // Safe: textContent previene XSS
    
    var fecha = document.createElement('span');
    fecha.className = 'pcard-date';
    fecha.textContent = fmtFecha(p.fechaCreacion);
    
    head.appendChild(h3);
    head.appendChild(fecha);
    
    // Sección de datos del perfil
    var data = document.createElement('div');
    data.className = 'pcard-data';
    
    var items = [
      ['Email', p.email],
      ['Edad', p.edad + ' anos'],
      ['Red', p.redSocial],
      ['Uso diario', p.horas + 'h']
    ];
    
    for (var i = 0; i < items.length; i++) {
      var d = document.createElement('div');
      d.className = 'ditem';
      
      var dl = document.createElement('span');
      dl.className = 'ditem-l';
      dl.textContent = items[i][0];
      
      var dv = document.createElement('span');
      dv.className = 'ditem-v';
      dv.textContent = items[i][1];
      
      d.appendChild(dl);
      d.appendChild(dv);
      data.appendChild(d);
    }
    
    // Sección de exposición digital
    var expSec = document.createElement('div');
    expSec.className = 'pcard-exp';
    
    var expLabel = document.createElement('span');
    expLabel.className = 'label';
    expLabel.textContent = 'Exposicion Digital';
    
    expSec.appendChild(expLabel);
    expSec.appendChild(makeBar(p.exposicion, p.riesgo));
    
    // Clasificación y riesgo
    var cls = document.createElement('div');
    cls.className = 'pcard-res';
    
    var badge = document.createElement('span');
    badge.className = 'badge ' + riesgoClass(p.riesgo);
    badge.textContent = 'Riesgo: ' + p.riesgo;
    
    var tipo = document.createElement('span');
    tipo.className = 'perfil-type';
    tipo.textContent = p.perfil;
    
    cls.appendChild(badge);
    cls.appendChild(tipo);
    
    // Botón de eliminar
    var btn = document.createElement('button');
    btn.className = 'btn-del';
    btn.textContent = 'Eliminar perfil';
    btn.setAttribute('aria-label', 'Eliminar perfil de ' + p.nombre);
    btn.addEventListener('click', function() { eliminarPerfil(p.id); });
    
    card.appendChild(head);
    card.appendChild(data);
    card.appendChild(expSec);
    card.appendChild(cls);
    card.appendChild(btn);
    
    return card;
  }
  
  /**
   * Renderiza sección de resultado después de análisis
   * Propósito: Mostrar análisis detallado del perfil creado recientemente
   * Seguridad: TODO el contenido usa textContent, NO innerHTML
   */
  function renderResultado(p) {
    vaciar(divResultado);
    
    var hd = document.createElement('div');
    hd.className = 'res-head';
    
    var th = document.createElement('h3');
    th.textContent = 'Resultado del Analisis';
    
    var sp = document.createElement('span');
    sp.textContent = 'para ' + p.nombre;
    
    hd.appendChild(th);
    hd.appendChild(sp);
    
    // Métricas del análisis
    var ms = document.createElement('div');
    ms.className = 'res-metrics';
    
    var mItems = [
      ['Red Social', p.redSocial],
      ['Uso Diario', p.horas + 'h'],
      ['Edad', p.edad + ' anos']
    ];
    
    for (var i = 0; i < mItems.length; i++) {
      var m = document.createElement('div');
      m.className = 'met';
      
      var ml = document.createElement('span');
      ml.className = 'met-label';
      ml.textContent = mItems[i][0];
      
      var mv = document.createElement('span');
      mv.className = 'met-val';
      mv.textContent = mItems[i][1];
      
      m.appendChild(ml);
      m.appendChild(mv);
      ms.appendChild(m);
    }
    
    // Barra de exposición
    var es = document.createElement('div');
    es.className = 'res-exp';
    
    var el = document.createElement('span');
    el.className = 'label';
    el.textContent = 'Exposicion Digital';
    
    es.appendChild(el);
    es.appendChild(makeBar(p.exposicion, p.riesgo));
    
    // Clasificación de riesgo y perfil
    var rc = document.createElement('div');
    rc.className = 'res-class';
    
    var bg = document.createElement('span');
    bg.className = 'badge ' + riesgoClass(p.riesgo);
    bg.textContent = 'Riesgo ' + p.riesgo;
    
    var tp = document.createElement('span');
    tp.className = 'perfil-type';
    tp.textContent = p.perfil;
    
    rc.appendChild(bg);
    rc.appendChild(tp);
    
    // Recomendación personalizada
    var rec = document.createElement('p');
    rec.className = 'res-rec';
    rec.textContent = getRecomendacion(p.riesgo);
    
    // Mensaje de confirmación
    var saveMsg = document.createElement('span');
    saveMsg.className = 'save-ok';
    saveMsg.textContent = 'Perfil guardado correctamente';
    
    divResultado.appendChild(hd);
    divResultado.appendChild(ms);
    divResultado.appendChild(es);
    divResultado.appendChild(rc);
    divResultado.appendChild(rec);
    divResultado.appendChild(saveMsg);
    
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
      email: sanitizar(inpEmail.value),
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
    clearAllErrors();
    
    var campos = ['nombre', 'email', 'edad', 'redSocial', 'horas'];
    for (var i = 0; i < campos.length; i++) {
      var el = document.getElementById(campos[i]);
      if (el) el.classList.remove('has-ok', 'has-error');
    }
  }
  
  // ============================================
  // MÓDULO: MANEJADORES DE EVENTOS (EVENT HANDLERS)
  // ============================================
  /**
   * AI-Assisted: Manejador principal del envío de formulario
   * Propósito: Orquestar el flujo completo de validación, análisis y guardado
   * Proceso:
   * 1. Prevenir envío por defecto
   * 2. Validar entrada
   * 3. Mostrar errores si es necesario
   * 4. Calcular exposición y perfiles
   * 5. Guardar y renderizar resultados
   * 6. Limpiar y scrollear a sección de resultados
   */
  function handleSubmit(e) {
    e.preventDefault();
    clearAllErrors();
    
    // Extraer y validar datos
    var datos = extraerDatos();
    var res = validarEntrada(datos);
    
    if (!res.ok) {
      // Mostrar todos los errores de validación
      for (var i = 0; i < res.errs.length; i++) {
        showError(res.errs[i].c, res.errs[i].m);
      }
      return;
    }
    
    // Feedback visual: deshabilitar botón mientras se procesa
    var btn = formulario.querySelector('.btn-submit');
    btn.disabled = true;
    btn.textContent = 'Analizando...';
    
    // Simular procesamiento con pequeña demora
    setTimeout(function() {
      // Calcular métricas de exposición
      var exp = calcExposicion(datos.horas);
      var rie = calcRiesgo(datos.horas);
      var per = calcPerfil(rie);
      
      // Crear objeto de perfil
      var perfil = {
        id: generarId(),
        nombre: datos.nombre,
        email: datos.email,
        edad: datos.edad,
        redSocial: datos.redSocial,
        horas: datos.horas,
        exposicion: Math.round(exp),
        riesgo: rie,
        perfil: per,
        fechaCreacion: new Date().toISOString()
      };
      
      // Guardar, renderizar y resetear
      agregarPerfil(perfil);
      renderResultado(perfil);
      renderTarjetas();
      limpiarForm();
      
      // Restaurar botón
      btn.disabled = false;
      btn.textContent = 'Analizar Exposicion';
      
      // Scroll a sección de resultados
      setTimeout(function() {
        secPerfiles.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }, 350);
  }
  
  // ============================================
  // MÓDULO: VALIDACIÓN EN TIEMPO REAL (REAL-TIME VALIDATION)
  // ============================================
  /**
   * Validación en tiempo real para email
   * Propósito: Feedback inmediato mientras el usuario escribe
   */
  function rtEmail() {
    var v = inpEmail.value.trim();
    if (!v) {
      clearError('email');
      return;
    }
    
    if (validarEmail(v)) {
      clearError('email');
      markOk('email');
    } else {
      showError('email', 'Formato de correo no valido');
    }
  }
  
  /**
   * Validación en tiempo real para nombre/nickname
   */
  function rtNombre() {
    var v = inpNombre.value.trim();
    if (!v) {
      clearError('nombre');
      return;
    }
    
    if (v.length >= NOMBRE_MIN) {
      clearError('nombre');
      markOk('nombre');
    } else {
      showError('nombre', 'Minimo 3 caracteres');
    }
  }
  
  /**
   * Validación en tiempo real para edad
   */
  function rtEdad() {
    var v = inpEdad.value;
    if (v === '') {
      clearError('edad');
      return;
    }
    
    if (validarRango(parseInt(v, 10), EDAD_MIN, EDAD_MAX)) {
      clearError('edad');
      markOk('edad');
    } else {
      showError('edad', 'Edad entre 13 y 100');
    }
  }
  
  /**
   * Validación en tiempo real para horas
   */
  function rtHoras() {
    var v = inpHoras.value;
    if (v === '') {
      clearError('horas');
      return;
    }
    
    if (validarRango(parseFloat(v), HORAS_MIN, HORAS_MAX)) {
      clearError('horas');
      markOk('horas');
    } else {
      showError('horas', 'Horas entre 0 y 24');
    }
  }
  
  /**
   * Validación para selección de red social
   */
  function rtRed() {
    if (inpRed.value) {
      clearError('redSocial');
      markOk('redSocial');
    } else {
      showError('redSocial', 'Selecciona una red social');
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
  // INICIALIZACIÓN: ATTACH EVENT LISTENERS
  // ============================================
  // Event listeners del formulario
  formulario.addEventListener('submit', handleSubmit);
  
  // Validación en tiempo real con debounce
  inpEmail.addEventListener('input', debounce(rtEmail, DEBOUNCE_MS));
  inpNombre.addEventListener('input', debounce(rtNombre, DEBOUNCE_MS));
  inpEdad.addEventListener('input', debounce(rtEdad, DEBOUNCE_MS));
  inpHoras.addEventListener('input', debounce(rtHoras, DEBOUNCE_MS));
  inpRed.addEventListener('change', rtRed);
  
  // Limpiar errores al enfocar
  inpNombre.addEventListener('focus', function() { clearError('nombre'); });
  inpEmail.addEventListener('focus', function() { clearError('email'); });
  inpEdad.addEventListener('focus', function() { clearError('edad'); });
  inpHoras.addEventListener('focus', function() { clearError('horas'); });
  
  // Inicialización: Generar partículas y cargar datos guardados
  generarParticulas();
  cargar();
})();
