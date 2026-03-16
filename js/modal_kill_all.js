/**
 * =============================================================================
 * ELIMINAR TODO - BLOQUEAR CUALQUIER MOVIMIENTO DE MODALES
 * =============================================================================
 * Este script intercepta y bloquea CUALQUIER intento de modificar
 * la posición de los modales
 */

(function() {
    'use strict';
    
    console.log('[MODAL KILL] Activando bloqueo total de modales...');

    // =========================================================================
    // BLOQUEAR setProperty en modal-dialog
    // =========================================================================
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
        const element = this;
        if (element && element.ownerElement) {
            const owner = element.ownerElement;
            if (owner.classList && owner.classList.contains('modal-dialog')) {
                const blockedProps = ['position', 'top', 'left', 'right', 'bottom', 'transform', 'translate', 'translateX', 'translateY', 'translateZ', 'translate3d'];
                if (blockedProps.some(prop => property.toLowerCase().includes(prop.toLowerCase()))) {
                    console.warn('[MODAL KILL] Bloqueado setProperty:', property, '=', value);
                    return; // NO APLICAR
                }
            }
            // También bloquear si es hijo de modal-dialog
            if (owner.closest && owner.closest('.modal-dialog')) {
                const dialog = owner.closest('.modal-dialog');
                if (dialog && dialog.classList.contains('modal-dialog')) {
                    const blockedProps = ['position', 'top', 'left', 'right', 'bottom', 'transform'];
                    if (blockedProps.some(prop => property.toLowerCase().includes(prop.toLowerCase()))) {
                        console.warn('[MODAL KILL] Bloqueado setProperty en hijo:', property);
                        return;
                    }
                }
            }
        }
        return originalSetProperty.call(this, property, value, priority);
    };

    // =========================================================================
    // BLOQUEAR style.property = value
    // =========================================================================
    function blockStyleProperty(element, property, value) {
        if (element.classList && element.classList.contains('modal-dialog')) {
            const blockedProps = ['position', 'top', 'left', 'right', 'bottom', 'transform'];
            if (blockedProps.includes(property.toLowerCase())) {
                console.warn('[MODAL KILL] Bloqueado style.' + property + ' =', value);
                return true; // BLOQUEADO
            }
        }
        return false;
    }

    // Interceptar todas las propiedades de style
    ['position', 'top', 'left', 'right', 'bottom', 'transform', 'margin', 'marginTop', 'marginLeft', 'marginRight', 'marginBottom'].forEach(function(prop) {
        try {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style') || 
                             Object.getOwnPropertyDescriptor(Element.prototype, 'style');
            
            if (descriptor && descriptor.get) {
                const originalGetter = descriptor.get;
                Object.defineProperty(HTMLElement.prototype, 'style', {
                    get: function() {
                        const style = originalGetter.call(this);
                        if (this.classList && this.classList.contains('modal-dialog')) {
                            // Crear proxy que bloquea propiedades críticas
                            return new Proxy(style, {
                                set: function(target, property, value) {
                                    if (['position', 'top', 'left', 'right', 'bottom', 'transform'].includes(property)) {
                                        console.warn('[MODAL KILL] Bloqueado style.' + property + ' =', value);
                                        return true; // No aplicar
                                    }
                                    target[property] = value;
                                    return true;
                                }
                            });
                        }
                        return style;
                    },
                    configurable: true
                });
            }
        } catch(e) {
            console.error('[MODAL KILL] Error interceptando style:', e);
        }
    });

    // =========================================================================
    // BLOQUEAR css() de jQuery
    // =========================================================================
    if (typeof jQuery !== 'undefined' && jQuery.fn && jQuery.fn.css) {
        const originalCss = jQuery.fn.css;
        jQuery.fn.css = function(prop, value) {
            if (this.length > 0 && this[0].classList && this[0].classList.contains('modal-dialog')) {
                if (typeof prop === 'object') {
                    // Bloquear objeto de propiedades
                    const blocked = {};
                    Object.keys(prop).forEach(function(key) {
                        if (!['position', 'top', 'left', 'right', 'bottom', 'transform'].includes(key.toLowerCase())) {
                            blocked[key] = prop[key];
                        } else {
                            console.warn('[MODAL KILL] Bloqueado jQuery.css:', key);
                        }
                    });
                    return originalCss.call(this, blocked, value);
                } else if (typeof prop === 'string') {
                    // Bloquear propiedad individual
                    if (['position', 'top', 'left', 'right', 'bottom', 'transform'].includes(prop.toLowerCase())) {
                        console.warn('[MODAL KILL] Bloqueado jQuery.css:', prop);
                        return this; // No aplicar
                    }
                }
            }
            return originalCss.apply(this, arguments);
        };
    }

    // =========================================================================
    // FORZAR POSICIÓN ESTÁTICA CADA FRAME
    // =========================================================================
    function forceStaticPosition() {
        document.querySelectorAll('.modal-dialog').forEach(function(dialog) {
            // Forzar posición estática
            dialog.style.setProperty('position', 'static', 'important');
            dialog.style.removeProperty('top');
            dialog.style.removeProperty('left');
            dialog.style.removeProperty('right');
            dialog.style.removeProperty('bottom');
            dialog.style.removeProperty('transform');
            dialog.style.setProperty('margin', '1.75rem auto', 'important');
        });
    }

    // Ejecutar cada frame
    function loop() {
        forceStaticPosition();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // También cada 10ms como respaldo
    setInterval(forceStaticPosition, 10);

    // =========================================================================
    // BLOQUEAR EVENTOS DE MOUSE QUE PUEDAN TRIGGEAR MOVIMIENTO
    // =========================================================================
    ['mousemove', 'mouseenter', 'mouseover', 'mouseleave', 'mouseout'].forEach(function(eventType) {
        document.addEventListener(eventType, function(e) {
            const modal = e.target.closest('.modal');
            if (modal) {
                forceStaticPosition();
            }
        }, { passive: true, capture: true });
    });

    // =========================================================================
    // OBSERVAR CAMBIOS Y REVERTIRLOS
    // =========================================================================
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList && target.classList.contains('modal-dialog')) {
                    console.warn('[MODAL KILL] Cambio detectado en modal-dialog, revirtiendo...');
                    setTimeout(forceStaticPosition, 0);
                }
            }
        });
    });

    function observeDialogs() {
        document.querySelectorAll('.modal-dialog').forEach(function(dialog) {
            observer.observe(dialog, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        });
    }

    // Observar modales existentes y nuevos
    observeDialogs();
    const bodyObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    if (node.classList && node.classList.contains('modal-dialog')) {
                        observeDialogs();
                        forceStaticPosition();
                    } else if (node.querySelector && node.querySelector('.modal-dialog')) {
                        observeDialogs();
                        forceStaticPosition();
                    }
                }
            });
        });
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    console.log('[MODAL KILL] Bloqueo total activado');
})();
