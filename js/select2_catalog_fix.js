/**
 * =============================================================================
 * FIX PARA DROPDOWN DE CATÁLOGO - SELECT2
 * =============================================================================
 * Mueve el elemento placeholder "----" al final del catálogo
 * Agrupa elementos padre con hijos colapsables/expandibles
 * =============================================================================
 */

(function($) {
    'use strict';

    // Backdrop oscuro cuando Select2 está abierto (contador por si hubiera varios abiertos)
    var select2BackdropCount = 0;
    var $select2Backdrop = null;

    function addSelect2Backdrop() {
        select2BackdropCount++;
        if ($select2Backdrop && $select2Backdrop.length) return;
        $select2Backdrop = $('<div class="select2-dropdown-backdrop" aria-hidden="true"></div>');
        $select2Backdrop.on('click', function() {
            $(document).find('.select2-container--open').each(function() {
                var $select = $(this).prev('select');
                if ($select.length) $select.select2('close');
            });
        });
        $('body').append($select2Backdrop);
    }

    function removeSelect2Backdrop() {
        select2BackdropCount--;
        if (select2BackdropCount <= 0) {
            select2BackdropCount = 0;
            if ($select2Backdrop && $select2Backdrop.length) {
                $select2Backdrop.remove();
                $select2Backdrop = null;
            }
        }
    }

    // Función para mover el placeholder "----" al final
    function movePlaceholderToEnd($dropdown) {
        var $options = $dropdown.find('.select2-results__option');
        var $placeholder = null;
        
        $options.each(function() {
            var $option = $(this);
            var text = $option.text().trim();
            // Considera placeholder cualquier opción compuesta solo por guiones
            // (p.ej. "----", "-----") o vacía.
            if (/^-+$/.test(text) || text === '') {
                $placeholder = $option;
                return false; // break
            }
        });
        
        if ($placeholder && $placeholder.length) {
            var $results = $placeholder.closest('.select2-results__options');
            if ($results.length) {
                $placeholder.detach();
                $results.append($placeholder);
            }
        }
    }

    // Quita espacios y caracteres invisibles al inicio/final (nbsp, zero-width, BOM, etc.).
    // .trim() solo quita espacio normal; no quita \u00A0 ni zero-width.
    function trimInvisible(str) {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/^[\s\u00A0\u200B-\u200D\uFEFF]+|[\s\u00A0\u200B-\u200D\uFEFF]+$/g, '');
    }

    // Elimina TODOS los chevrons/emojis, >> y " > " del string (regla fuerte para que nada los muestre).
    function stripAllChevronsAndEmojis(str) {
        if (!str || typeof str !== 'string') return str;
        return trimInvisible(str
            .replace(/>>/g, ' ')
            .replace(/\s*>\s*>\s*/g, ' ')
            .replace(/\s*>\s*/g, ' ')  // separador " > " del árbol (completename)
            .replace(/[\u00BB\u203A\u226A\u226B]/g, '')
            .replace(/^>\s*>\s*|^»\s*»\s*/g, '')
            .replace(/&raquo;/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/[\u25B6\u25B8\u203A\u27A4]/g, '')
            .replace(/[»«]/g, '')
            .replace(/[📂📁📄➤]/g, '')
            .replace(/\s*[»«▶▸›➤]\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim());
    }

    // Solo limpia chevrons/emojis del texto. NO añade ningún icono (sin carpeta, sin triángulos).
    function cleanChevronsFromOptions($dropdown) {
        var $items = $dropdown.find('.select2-results__option, .select2-results__group');
        
        $items.each(function() {
            var $option = $(this);
            
            if ($option.attr('data-select2-fixed') === 'true') {
                return;
            }
            
            var originalText = $option.text() || '';
            var originalHtml = $option.html() || '';
            var trimmed = originalText.trim();
            
            if (/^-+$/.test(trimmed) || trimmed === '') return;

            // Quitar cualquier icono/prefijo que haya podido inyectar otro script
            $option.find('.select2-option-prefix, i.fas.fa-folder, i.fas.fa-caret-right').remove();
            
            // Limpiar el HTML: quitar spans de toggle, chevrons y emojis (sin tocar select2-rendered__match)
            var cleanedHtml = (originalHtml || '').toString();
            cleanedHtml = cleanedHtml.replace(/&nbsp;/gi, ' ');  // Eliminar caracteres &nbsp; y dejar solo espacios normales
            cleanedHtml = cleanedHtml.replace(/<span[^>]*class="[^"]*group-toggle-icon[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
            cleanedHtml = cleanedHtml.replace(/<span[^>]*class="[^"]*select2-option-prefix[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
            cleanedHtml = cleanedHtml.replace(/\s*>\s*>\s*/g, ' ');
            cleanedHtml = cleanedHtml.replace(/[\u00BB\u203A\u226A\u226B]/g, '');  // » › ≪ ≫
            cleanedHtml = cleanedHtml.replace(/^>\s*>\s*|^»\s*»\s*/g, '');
            cleanedHtml = cleanedHtml.replace(/[\u25B6\u25B8\u203A\u27A4»«]/g, '');
            cleanedHtml = cleanedHtml.replace(/[📂📁📄➤]/g, '');
            cleanedHtml = cleanedHtml.replace(/&raquo;/g, '');
            cleanedHtml = cleanedHtml.replace(/\s*[»«▶▸›➤]\s*/g, ' ').replace(/\s+/g, ' ').trim();
            // Quitar espacios/caracteres invisibles al inicio y final (evita que hijos queden más indentados)
            cleanedHtml = trimInvisible(cleanedHtml);
            
            var cleanedText = stripAllChevronsAndEmojis(originalText);
            if (!cleanedText && !cleanedHtml) return;
            
            // Quitar el span de resaltado (select2-rendered__match) para que no se subraye nada
            cleanedHtml = cleanedHtml.replace(/<span[^>]*class="[^"]*select2-rendered__match[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
            cleanedHtml = cleanedHtml.replace(/<span class='select2-rendered__match'>([\s\S]*?)<\/span>/gi, '$1');
            
            // Dejar solo el texto limpio (sin espacios ni caracteres ocultos al inicio)
            var finalText = trimInvisible(cleanedText || cleanedHtml);
            if (cleanedHtml.indexOf('<span') !== -1) {
                $option.html(cleanedHtml);
            } else {
                $option.text(finalText);
            }
            // Limpiar también el title: quitar >>, », &nbsp; y espacios raros
            var t = $option.attr('title');
            if (t) {
                t = t.replace(/\s*>\s*>\s*/g, ' ').replace(/[\u00BB\u203A\u226A\u226B»«]/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
                $option.attr('title', t);
            }
            $option.attr('data-select2-fixed', 'true');
        });
        // Segunda pasada: forzar eliminación de >> y » en todos los span y en el texto directo de la opción
        $dropdown.find('.select2-results__option span').each(function() {
            var $span = $(this);
            var txt = $span.text();
            if (!txt || typeof txt !== 'string') return;
            var cleaned = txt.replace(/\s*>\s*>\s*/g, ' ').replace(/[\u00BB\u203A\u226A\u226B]/g, '').replace(/^[\s\u00A0]*(>>|»»|»|\u00BB|\u203A|\u226A|\u226B)+\s*/g, '').replace(/\s*(>>|»»|»|\u00BB|\u203A|\u226A|\u226B)\s*$/g, '').replace(/[»«]/g, '').trim();
            if (cleaned !== txt) {
                $span.text(cleaned);
            }
        });
        // Tercera pasada: forzar eliminación de >> y » en el texto visible de cada opción
        $dropdown.find('.select2-results__option').each(function() {
            var $opt = $(this);
            var fullText = $opt.text();
            var cleaned = stripAllChevronsAndEmojis(fullText);
            if (cleaned !== fullText && cleaned.length > 0) {
                $opt.text(cleaned);
            }
        });
    }

    // Fuerza quitar » / >> / ≫ y " > " de todo el dropdown (prioridad sobre cualquier regla o dato del servidor)
    function forceStripChevronsFromDropdown($dropdown) {
        if (!$dropdown || !$dropdown.length) return;
        $dropdown.find('.select2-results__option, .select2-results__group').each(function() {
            var $opt = $(this);
            $opt.find('span').each(function() {
                var $span = $(this);
                var t = $span.text();
                if (!t) return;
                var cleaned = t.replace(/>>/g, ' ').replace(/\s*>\s*>\s*/g, ' ').replace(/\s*>\s*/g, ' ').replace(/[\u00BB\u203A\u226A\u226B\u25B6\u25B8\u27A4»«]/g, '').replace(/&raquo;/g, '').replace(/^\s+|\s+$/g, '');
                if (cleaned !== t) $span.text(cleaned);
            });
            var full = $opt.text();
            var cleaned = stripAllChevronsAndEmojis(full);
            if (cleaned !== full && cleaned.length > 0) {
                $opt.text(cleaned);
            }
        });
    }

    // Función para agrupar y colapsar elementos padre con hijos
    function applyGroupingAndCollapse($dropdown) {
        var $options = $dropdown.find('.select2-results__option');
        var currentParent = null;
        var $parentGroup = null;
        
        $options.each(function() {
            var $option = $(this);
            var text = $option.text().trim();
            
            // Detecta si es un padre (no tiene indentación y no es "----")
            var isParent = !$option.hasClass('select2-results__option--child') &&
                          !/^-+$/.test(text) &&
                          text.length > 0;
            
            if (isParent) {
                currentParent = $option;
                $parentGroup = $('<div class="select2-parent-group"></div>');
                $option.wrap($parentGroup);
            } else if (currentParent && $option.hasClass('select2-results__option--child')) {
                // Es un hijo, lo agrega al grupo del padre
                if ($parentGroup && $parentGroup.length) {
                    $option.appendTo($parentGroup);
                }
            }
        });
    }

    // Limpia iconos/emojis del campo cuando se muestra el valor seleccionado
    function removeEmojisFromSelection() {
        $('.select2-selection__rendered').each(function() {
            var $rendered = $(this);
            $rendered.find('.select2-option-prefix, i.fas.fa-folder, i.fas.fa-caret-right').remove();
            var html = $rendered.html() || '';
            if (/[📂📁📄➤▶▸›»«]/.test(html)) {
                $rendered.html(html.replace(/[📂📁📄➤▶▸›»«]/g, '').replace(/\s+/g, ' ').trim());
            }
        });
    }

    // Función para forzar color azul en títulos de grupo - EJECUTAR INMEDIATAMENTE
    function forceGroupTitleColor($dropdown) {
        if (!$dropdown || !$dropdown.length) return;
        
        // Forzar color azul en todos los títulos de grupo inmediatamente
        // Incluir también los span hijos dentro de los grupos
        var $groups = $dropdown.find('.select2-results__group, strong.select2-results__group');
        $groups.each(function() {
            var $group = $(this);
            // Forzar color azul usando style inline con !important en el elemento principal
            $group[0].style.setProperty('color', '#162a56', 'important');
            $group[0].style.setProperty('background-color', 'transparent', 'important');
            $group[0].style.setProperty('background', 'transparent', 'important');
            
            // También forzar color azul en TODOS los span hijos dentro del grupo
            var $spans = $group.find('span');
            $spans.each(function() {
                var $span = $(this);
                $span[0].style.setProperty('color', '#162a56', 'important');
                $span[0].style.setProperty('background-color', 'transparent', 'important');
                $span[0].style.setProperty('background', 'transparent', 'important');
            });
        });
        
        // También buscar directamente los span dentro de grupos por si acaso
        var $groupSpans = $dropdown.find('.select2-results__group span, strong.select2-results__group span');
        $groupSpans.each(function() {
            var $span = $(this);
            $span[0].style.setProperty('color', '#162a56', 'important');
            $span[0].style.setProperty('background-color', 'transparent', 'important');
            $span[0].style.setProperty('background', 'transparent', 'important');
        });
    }

    // True si este dropdown es de Estado, Prioridad o Validación (deben conservar iconos de templateResult)
    function isStatusPriorityOrValidationDropdown($dropdown) {
        if (!$dropdown || !$dropdown.length) return false;
        var $ul = $dropdown.find('ul[id^="select2-"][id$="-results"]').first();
        var listId = $ul.attr('id') || '';
        var selectId = listId.replace(/^select2-/, '').replace(/-results$/, '');
        if (!selectId) {
            var $open = $('.select2-container--open');
            var $sel = $open.prev('select');
            if ($sel.length) selectId = ($sel.attr('id') || $sel.attr('name') || '');
        }
        return /status|priority|validation/.test(selectId);
    }

    // Función principal que aplica todos los fixes
    function applyAllFixes($dropdown) {
        if (!$dropdown || !$dropdown.length) return;
        
        // PRIMERO: Forzar color azul inmediatamente antes de cualquier otra operación
        forceGroupTitleColor($dropdown);
        
        // No limpiar chevrons ni reemplazar HTML en Estado/Prioridad/Validación para no quitar los iconos
        if (!isStatusPriorityOrValidationDropdown($dropdown)) {
            cleanChevronsFromOptions($dropdown);
        }
        applyGroupingAndCollapse($dropdown);
        removeEmojisFromSelection();
        
        // VOLVER A FORZAR después de aplicar otros fixes por si acaso
        forceGroupTitleColor($dropdown);
    }

    // Limita la altura del dropdown para que no se salga del viewport (abajo o arriba)
    function adjustDropdownHeight($dropdown) {
        if (!$dropdown || !$dropdown.length || !$dropdown[0].getBoundingClientRect) return;
        try {
            var rect = $dropdown[0].getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return; // no visible
            var viewportHeight = window.innerHeight;
            var margin = 32;
            var maxHeight;
            if ($dropdown.hasClass('select2-dropdown--below')) {
                var spaceBelow = viewportHeight - rect.top - margin;
                maxHeight = Math.max(100, Math.min(400, spaceBelow));
            } else if ($dropdown.hasClass('select2-dropdown--above')) {
                var spaceAbove = rect.bottom - margin;
                maxHeight = Math.max(100, Math.min(400, spaceAbove));
            } else {
                maxHeight = Math.max(100, viewportHeight - margin * 2);
            }
            $dropdown[0].style.setProperty('max-height', maxHeight + 'px', 'important');
            $dropdown[0].style.setProperty('overflow', 'hidden', 'important');
            var $results = $dropdown.find('.select2-results');
            if ($results.length) {
                var resultsMax = Math.max(80, maxHeight - 60);
                $results[0].style.setProperty('max-height', resultsMax + 'px', 'important');
                $results[0].style.setProperty('overflow', 'hidden', 'important'); /* sin scroll: solo el ul principal */
            }
            var $options = $results.length ? $results.children('ul.select2-results__options') : $();
            if ($options.length) {
                var optionsMax = Math.max(80, maxHeight - 70);
                $options[0].style.setProperty('max-height', optionsMax + 'px', 'important');
                $options[0].style.setProperty('overflow-y', 'auto', 'important'); /* única barra: solo el ul principal */
            }
            $dropdown.find('.select2-results__options--nested').each(function() {
                this.style.removeProperty('max-height');
                this.style.setProperty('overflow', 'visible', 'important');
                this.style.setProperty('overflow-y', 'visible', 'important');
            });
        } catch (e) {
            console.error('Error ajustando altura del dropdown:', e);
        }
    }

    // Función para ajustar el posicionamiento del dropdown manteniéndolo dentro de la página
    function adjustDropdownPosition($dropdown) {
        if (!$dropdown || !$dropdown.length || !$dropdown.is(':visible')) return;
        
        try {
            adjustDropdownHeight($dropdown);
            
            var $container = $dropdown.closest('.select2-container');
            if (!$container.length) return;
            
            var viewportWidth = $(window).width();
            var scrollLeft = $(window).scrollLeft();
            var margin = 20; // Margen de seguridad desde los bordes
            
            // Obtener la posición actual del dropdown
            var dropdownOffset = $dropdown.offset();
            if (!dropdownOffset) return;
            
            var containerOffset = $container.offset();
            if (!containerOffset) return;
            
            var dropdownWidth = $dropdown.outerWidth(true);
            var dropdownLeft = dropdownOffset.left - scrollLeft;
            var dropdownRight = dropdownLeft + dropdownWidth;
            var viewportRight = viewportWidth;
            var viewportLeft = 0;
            
            // Obtener el left actual (select2 lo establece relativo al contenedor)
            var currentLeft = parseFloat($dropdown.css('left')) || 0;
            var newLeft = currentLeft;
            var needsAdjustment = false;
            
            // Verificar si se sale por la derecha
            if (dropdownRight > viewportRight - margin) {
                var overflowRight = dropdownRight - (viewportRight - margin);
                newLeft = currentLeft - overflowRight;
                needsAdjustment = true;
            }
            
            // Verificar si se sale por la izquierda (después del ajuste o originalmente)
            var containerLeft = containerOffset.left - scrollLeft;
            var minLeft = 0; // Mínimo: alineado con el inicio del contenedor
            
            // Calcular la posición absoluta del nuevo left
            var newAbsoluteLeft = containerLeft + newLeft;
            
            if (newAbsoluteLeft < viewportLeft + margin) {
                // Si se sale por la izquierda, ajustar para que quepa
                var overflowLeft = (viewportLeft + margin) - newAbsoluteLeft;
                newLeft = newLeft + overflowLeft;
                needsAdjustment = true;
            }
            
            // Si se necesita ajuste, aplicarlo
            if (needsAdjustment) {
                // Verificar nuevamente que no se salga por la derecha después del ajuste
                var finalAbsoluteLeft = containerLeft + newLeft;
                var finalAbsoluteRight = finalAbsoluteLeft + dropdownWidth;
                
                if (finalAbsoluteRight > viewportRight - margin) {
                    // Si aún se sale por la derecha, limitar el ancho en lugar de mover más
                    var maxWidth = viewportRight - finalAbsoluteLeft - margin;
                    if (maxWidth > 200) {
                        $dropdown[0].style.setProperty('max-width', maxWidth + 'px', 'important');
                    }
                } else {
                    // Si cabe, remover cualquier limitación de ancho previa
                    $dropdown[0].style.removeProperty('max-width');
                }
                
                // Aplicar la nueva posición
                $dropdown[0].style.setProperty('left', newLeft + 'px', 'important');
            }
        } catch (e) {
            console.error('Error ajustando posición del dropdown:', e);
        }
    }

    // Aplica los fixes cuando se abre el dropdown
    // Sin animación: ocultamos el dropdown hasta tener la posición correcta, luego lo mostramos
    function applyPositionAndShow($dropdown) {
        if (!$dropdown || !$dropdown.length) return;
        requestAnimationFrame(function() {
            applyAllFixes($dropdown);
            adjustDropdownHeight($dropdown);
            var currentLeft = parseFloat($dropdown.css('left')) || 0;
            if (currentLeft < 0) {
                $dropdown[0].style.setProperty('left', '0', 'important');
            }
            var viewportWidth = $(window).width();
            var scrollLeft = $(window).scrollLeft();
            var dropdownOffset = $dropdown.offset();
            if (dropdownOffset) {
                var dropdownRight = dropdownOffset.left - scrollLeft + $dropdown.outerWidth(true);
                if (dropdownRight > viewportWidth - 20) {
                    adjustDropdownPosition($dropdown);
                }
            }
            forceGroupTitleColor($dropdown);
            requestAnimationFrame(function() {
                $('body').removeClass('select2-dropdown-positioning');
            });
        });
    }

    $(document).on('select2:open', function(e) {
        addSelect2Backdrop();
        removeEmojisFromSelection();
        $('body').addClass('select2-dropdown-positioning');
        
        var $dropdown = $('.select2-dropdown').last();
        if ($dropdown.length) {
            forceGroupTitleColor($dropdown);
        }
        
        function tryApplyPosition() {
            var $dropdown = $('.select2-dropdown').last();
            if ($dropdown.length && $dropdown.is(':visible')) {
                applyPositionAndShow($dropdown);
                return true;
            }
            return false;
        }
        setTimeout(function() {
            if (!tryApplyPosition()) {
                setTimeout(function() {
                    if (!tryApplyPosition()) {
                        $('body').removeClass('select2-dropdown-positioning');
                    }
                }, 20);
            }
        }, 0);
        
        setTimeout(function() {
            var $dropdown = $('.select2-dropdown').last();
            if ($dropdown.length) {
                forceGroupTitleColor($dropdown);
            }
        }, 10);
        
        // Forzar quitar »/>> y ajustar altura varias veces por si las opciones se cargan tarde (Proceso Solicitante, Categoría, etc.)
        [0, 50, 80, 150, 200, 350, 500, 700, 1000, 1500].forEach(function(delay) {
            setTimeout(function() {
                var $d = $('.select2-dropdown').last();
                if ($d.length && $d.is(':visible')) {
                    adjustDropdownHeight($d);
                    if (!isStatusPriorityOrValidationDropdown($d)) forceStripChevronsFromDropdown($d);
                    forceGroupTitleColor($d);
                }
            }, delay);
        });
    });
    
    // Elimina emojis cuando se selecciona un valor
    $(document).on('select2:select', function(e) {
        // FORZAR COLOR AZUL INMEDIATAMENTE cuando se selecciona una opción
        var $dropdown = $('.select2-dropdown').last();
        if ($dropdown.length) {
            forceGroupTitleColor($dropdown);
        }
        
        setTimeout(function() {
            removeEmojisFromSelection();
            // FORZAR COLOR AZUL después del timeout también
            var $dropdown = $('.select2-dropdown').last();
            if ($dropdown.length) {
                forceGroupTitleColor($dropdown);
            }
        }, 50);
    });
    
    // Listener adicional para cuando se hace hover o se destaca una opción
    $(document).on('mouseenter', '.select2-results__option--highlighted, .select2-results__option[aria-selected="true"]', function() {
        var $dropdown = $(this).closest('.select2-dropdown');
        if ($dropdown.length) {
            forceGroupTitleColor($dropdown);
        }
    });

    // Aplica los fixes cuando se actualizan los resultados (búsqueda, Categoría, Proceso Solicitante, etc.)
    $(document).on('select2:results:all', function() {
        var $dropdown = $('.select2-dropdown').last();
        if ($dropdown.length) {
            forceGroupTitleColor($dropdown);
            adjustDropdownHeight($dropdown);
            if (!isStatusPriorityOrValidationDropdown($dropdown)) forceStripChevronsFromDropdown($dropdown);
        }
        [50, 100, 200, 400].forEach(function(delay) {
            setTimeout(function() {
                var $d = $('.select2-dropdown').last();
                if ($d.length && $d.is(':visible')) {
                    adjustDropdownHeight($d);
                    if (!isStatusPriorityOrValidationDropdown($d)) forceStripChevronsFromDropdown($d);
                    forceGroupTitleColor($d);
                }
            }, delay);
        });
    });

    // Aplica los fixes al cargar la página
    $(document).ready(function() {
        setTimeout(function() {
            var $dropdown = $('.select2-dropdown').last();
            applyAllFixes($dropdown);
        }, 500);
    });
    
    // Observa cambios en el DOM del dropdown para aplicar fixes dinámicamente
    var observer = null;
    var observerTimeout = null;
    var positionCheckInterval = null;
    
    // Inicia la observación cuando hay un dropdown visible
    $(document).on('select2:open', function() {
        // Limpiar cualquier timeout pendiente
        if (observerTimeout) {
            clearTimeout(observerTimeout);
        }
        
        // Limpiar intervalo anterior si existe
        if (positionCheckInterval) {
            clearInterval(positionCheckInterval);
        }
        
        // Eliminado el intervalo de verificación continua que causaba animación extraña
        // El posicionamiento se ajusta solo una vez al abrir el dropdown
        
        // También ajustar cuando se redimensiona la ventana
        $(window).on('resize.select2-position-fix', function() {
            var $dropdown = $('.select2-dropdown').last();
            if ($dropdown.length && $dropdown.is(':visible')) {
                adjustDropdownPosition($dropdown);
            }
        });
        
        setTimeout(function() {
            var $dropdown = $('.select2-dropdown').last();
            var $results = $dropdown.find('.select2-results__options');
            if ($results.length) {
                // Desconectar observer anterior si existe
                if (observer) {
                    observer.disconnect();
                }
                
                // Crear nuevo observer simplificado para evitar animación extraña
                observer = new MutationObserver(function(mutations) {
                    // FORZAR COLOR AZUL INMEDIATAMENTE cuando se detectan cambios
                    var $dropdown = $('.select2-dropdown').last();
                    if ($dropdown.length) {
                        forceGroupTitleColor($dropdown);
                        adjustDropdownHeight($dropdown);
                    }
                    
                    // Usar debounce más largo para evitar ejecuciones múltiples que causan animación
                    if (observerTimeout) {
                        clearTimeout(observerTimeout);
                    }
                    observerTimeout = setTimeout(function() {
                        var $dropdown = $('.select2-dropdown').last();
                        if ($dropdown.length) {
                            adjustDropdownHeight($dropdown);
                            var $newItems = $dropdown.find('.select2-results__option:not([data-select2-fixed]), .select2-results__group:not([data-select2-fixed])');
                            if ($newItems.length > 0 && !isStatusPriorityOrValidationDropdown($dropdown)) {
                                cleanChevronsFromOptions($dropdown);
                            }
                            if (!isStatusPriorityOrValidationDropdown($dropdown)) forceStripChevronsFromDropdown($dropdown);
                            forceGroupTitleColor($dropdown);
                        }
                    }, 200);
                });
                
                observer.observe($results[0], { childList: true, subtree: true });
                
                // Eliminado el observer de cambios de estilo que causaba animación extraña
                // El posicionamiento se establece solo una vez al abrir
            }
        }, 150);
    });
    
    $(document).on('select2:close', function() {
        $('body').removeClass('select2-dropdown-positioning');
        removeSelect2Backdrop();
        // Desconectar observer
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        // Limpiar timeout
        if (observerTimeout) {
            clearTimeout(observerTimeout);
            observerTimeout = null;
        }
        // Limpiar intervalo de verificación de posición
        if (positionCheckInterval) {
            clearInterval(positionCheckInterval);
            positionCheckInterval = null;
        }
        // Remover listener de resize
        $(window).off('resize.select2-position-fix');
        // Limpiar marcas de procesado para que se puedan procesar de nuevo en la próxima apertura
        $('.select2-dropdown [data-select2-fixed]').removeAttr('data-select2-fixed');
    });

})(jQuery);
