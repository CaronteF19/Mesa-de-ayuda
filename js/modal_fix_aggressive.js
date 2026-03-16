/**
 * =============================================================================
 * FIX AGRESIVO PARA MODALES - FORZAR POSICIÓN FIJA
 * =============================================================================
 * Este script fuerza la posición de los modales de forma agresiva,
 * bloqueando cualquier código que intente moverlos
 */

(function() {
    'use strict';

    console.log('[MODAL FIX] Iniciando fix agresivo para modales...');

    // =========================================================================
    // FUNCIÓN PRINCIPAL: FORZAR POSICIÓN FIJA
    // =========================================================================
    function forceModalPosition() {
        const modals = document.querySelectorAll('.modal.show, .modal.fade.show');
        modals.forEach(function(modal) {
            const dialog = modal.querySelector('.modal-dialog');
            if (dialog) {
                // Forzar posición usando múltiples métodos
                dialog.style.setProperty('position', 'fixed', 'important');
                dialog.style.setProperty('top', '2rem', 'important');
                dialog.style.setProperty('left', '50%', 'important');
                dialog.style.setProperty('right', 'auto', 'important');
                dialog.style.setProperty('bottom', 'auto', 'important');
                dialog.style.setProperty('transform', 'translateX(-50%)', 'important');
                dialog.style.setProperty('margin', '0', 'important');
                dialog.style.setProperty('will-change', 'auto', 'important');
                dialog.style.setProperty('transition', 'none', 'important');
                dialog.style.setProperty('animation', 'none', 'important');
                
                // También forzar en el modal mismo
                modal.style.setProperty('position', 'fixed', 'important');
                modal.style.setProperty('top', '0', 'important');
                modal.style.setProperty('left', '0', 'important');
            }
        });
    }

    // =========================================================================
    // BLOQUEAR MUTATION OBSERVER Y CAMBIOS DE ESTILO
    // =========================================================================
    function blockStyleMutations() {
        // Interceptar setProperty y style directo
        const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
        CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
            const element = this;
            if (element && element.ownerElement) {
                const owner = element.ownerElement;
                if (owner.classList && 
                    (owner.classList.contains('modal-dialog') || 
                     owner.closest && owner.closest('.modal-dialog'))) {
                    const dialog = owner.classList.contains('modal-dialog') ? owner : owner.closest('.modal-dialog');
                    if (dialog) {
                        // Bloquear cambios a propiedades críticas
                        if (['position', 'top', 'left', 'right', 'bottom', 'transform', 'margin'].includes(property)) {
                            console.warn('[MODAL FIX] Bloqueado cambio de', property, 'en modal-dialog');
                            return; // No aplicar el cambio
                        }
                    }
                }
            }
            return originalSetProperty.call(this, property, value, priority);
        };

        // Interceptar asignación directa a style
        const styleDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style') || 
                                Object.getOwnPropertyDescriptor(Element.prototype, 'style');
        
        if (styleDescriptor && styleDescriptor.set) {
            const originalStyleSetter = styleDescriptor.set;
            Object.defineProperty(HTMLElement.prototype, 'style', {
                set: function(value) {
                    if (this.classList && this.classList.contains('modal-dialog')) {
                        // Permitir pero luego forzar posición
                        originalStyleSetter.call(this, value);
                        forceModalPosition();
                        return;
                    }
                    originalStyleSetter.call(this, value);
                },
                get: styleDescriptor.get,
                configurable: true
            });
        }
    }

    // =========================================================================
    // SOBRESCRIBIR BOOTSTRAP MODAL
    // =========================================================================
    function overrideBootstrapModal() {
        if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
            return;
        }

        const OriginalModal = bootstrap.Modal;
        
        // Crear nueva clase que sobrescribe métodos problemáticos
        bootstrap.Modal = function(element, config) {
            const instance = new OriginalModal(element, config);
            const originalHandleUpdate = instance.handleUpdate;
            const originalShow = instance.show;
            const originalHide = instance.hide;

            // Bloquear handleUpdate completamente
            instance.handleUpdate = function() {
                console.log('[MODAL FIX] handleUpdate bloqueado');
                forceModalPosition();
                return instance;
            };

            // Interceptar show para forzar posición después
            instance.show = function() {
                const result = originalShow.call(this);
                setTimeout(forceModalPosition, 0);
                setTimeout(forceModalPosition, 10);
                setTimeout(forceModalPosition, 50);
                return result;
            };

            // Interceptar hide
            instance.hide = function() {
                return originalHide.call(this);
            };

            return instance;
        };

        // Copiar propiedades estáticas
        Object.setPrototypeOf(bootstrap.Modal, OriginalModal);
        Object.keys(OriginalModal).forEach(function(key) {
            bootstrap.Modal[key] = OriginalModal[key];
        });
    }

    // =========================================================================
    // BLOQUEAR EVENTOS DE MOUSE GLOBALES
    // =========================================================================
    function blockGlobalMouseEvents() {
        // Bloquear mousemove en modales
        document.addEventListener('mousemove', function(e) {
            const modal = e.target.closest('.modal.show, .modal.fade.show');
            if (modal) {
                forceModalPosition();
            }
        }, { passive: true, capture: true });

        // Bloquear mouseenter/mouseover
        ['mouseenter', 'mouseover', 'mouseleave', 'mouseout'].forEach(function(eventType) {
            document.addEventListener(eventType, function(e) {
                const modal = e.target.closest('.modal.show, .modal.fade.show');
                if (modal) {
                    forceModalPosition();
                }
            }, { passive: true, capture: true });
        });

        // Bloquear scroll y resize
        ['scroll', 'resize'].forEach(function(eventType) {
            window.addEventListener(eventType, function() {
                forceModalPosition();
            }, { passive: true });
        });
    }

    // =========================================================================
    // OBSERVAR NUEVOS MODALES
    // =========================================================================
    function observeNewModals() {
        const observer = new MutationObserver(function(mutations) {
            let shouldForce = false;
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && 
                            (node.classList.contains('modal') || 
                             node.querySelector && node.querySelector('.modal'))) {
                            shouldForce = true;
                        }
                    }
                });
                
                // Si se agregó la clase 'show' a un modal
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class' &&
                    mutation.target.classList &&
                    mutation.target.classList.contains('modal') &&
                    mutation.target.classList.contains('show')) {
                    shouldForce = true;
                }
            });
            
            if (shouldForce) {
                setTimeout(forceModalPosition, 0);
                setTimeout(forceModalPosition, 10);
                setTimeout(forceModalPosition, 50);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // =========================================================================
    // FORZAR POSICIÓN EN CADA FRAME (MÁXIMA AGRESIVIDAD)
    // =========================================================================
    function forcePositionEveryFrame() {
        function force() {
            forceModalPosition();
            requestAnimationFrame(force);
        }
        requestAnimationFrame(force);
    }

    // =========================================================================
    // INICIALIZAR TODO
    // =========================================================================
    function init() {
        blockStyleMutations();
        overrideBootstrapModal();
        blockGlobalMouseEvents();
        observeNewModals();
        forceModalPosition();
        
        // Forzar posición cada 50ms como respaldo
        setInterval(forceModalPosition, 50);
        
        // Forzar posición en cada frame (máxima agresividad)
        forcePositionEveryFrame();
        
        console.log('[MODAL FIX] Fix agresivo activado');
    }

    // Ejecutar inmediatamente y cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // También ejecutar después de un pequeño delay para asegurar que todo esté cargado
    setTimeout(init, 100);
    setTimeout(init, 500);

})();
