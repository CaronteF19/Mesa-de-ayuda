/**
 * =============================================================================
 * SCRIPT DE DEPURACIÓN PARA MODALES - BLOQUEAR MOVIMIENTO
 * =============================================================================
 * Este script bloquea eventos de mouse y detecta qué está causando
 * el movimiento de los modales
 */

(function() {
    'use strict';

    // =========================================================================
    // PASO 1: BLOQUEAR EVENTOS DE MOUSE EN MODALES
    // =========================================================================
    function blockMouseEventsOnModals() {
        // Bloquear eventos de mouse en modales cuando están visibles
        document.addEventListener('mousemove', function(e) {
            const modal = e.target.closest('.modal');
            if (modal && modal.classList.contains('show')) {
                // Prevenir que eventos de mouse afecten el modal
                const modalDialog = modal.querySelector('.modal-dialog');
                if (modalDialog) {
                    // Forzar posición fija
                    modalDialog.style.position = 'fixed';
                    modalDialog.style.top = '2rem';
                    modalDialog.style.left = '50%';
                    modalDialog.style.transform = 'translateX(-50%)';
                    modalDialog.style.margin = '0';
                }
            }
        }, { passive: false });

        // Bloquear mouseenter/mouseover en modales
        document.addEventListener('mouseenter', function(e) {
            if (e.target.closest('.modal.show')) {
                e.stopPropagation();
            }
        }, true);

        document.addEventListener('mouseover', function(e) {
            if (e.target.closest('.modal.show')) {
                e.stopPropagation();
            }
        }, true);
    }

    // =========================================================================
    // PASO 2: OBSERVAR CAMBIOS EN LA POSICIÓN DEL MODAL
    // =========================================================================
    function observeModalPosition() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('modal-dialog')) {
                        const computed = window.getComputedStyle(target);
                        console.warn('[MODAL DEBUG] Cambio detectado en modal-dialog:', {
                            element: target,
                            position: computed.position,
                            top: computed.top,
                            left: computed.left,
                            transform: computed.transform,
                            style: target.getAttribute('style')
                        });

                        // Forzar posición fija
                        target.style.position = 'fixed';
                        target.style.top = '2rem';
                        target.style.left = '50%';
                        target.style.transform = 'translateX(-50%)';
                        target.style.margin = '0';
                    }
                }
            });
        });

        // Observar todos los modales
        function observeAllModals() {
            document.querySelectorAll('.modal-dialog').forEach(function(dialog) {
                observer.observe(dialog, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            });
        }

        // Observar modales existentes
        observeAllModals();

        // Observar nuevos modales que se agreguen
        const modalObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('modal-dialog')) {
                            observer.observe(node, {
                                attributes: true,
                                attributeFilter: ['style', 'class']
                            });
                        }
                        // También buscar dentro del nodo
                        const dialogs = node.querySelectorAll && node.querySelectorAll('.modal-dialog');
                        if (dialogs) {
                            dialogs.forEach(function(dialog) {
                                observer.observe(dialog, {
                                    attributes: true,
                                    attributeFilter: ['style', 'class']
                                });
                            });
                        }
                    }
                });
            });
        });

        modalObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // =========================================================================
    // PASO 3: BLOQUEAR handleUpdate DE BOOTSTRAP
    // =========================================================================
    function blockBootstrapHandleUpdate() {
        // Interceptar handleUpdate de Bootstrap Modal
        document.addEventListener('DOMContentLoaded', function() {
            // Buscar todos los modales y sobrescribir handleUpdate
            const modals = document.querySelectorAll('.modal');
            modals.forEach(function(modalEl) {
                if (modalEl._bsModal) {
                    const originalHandleUpdate = modalEl._bsModal.handleUpdate;
                    modalEl._bsModal.handleUpdate = function() {
                        // No hacer nada - prevenir reposicionamiento
                        console.log('[MODAL DEBUG] handleUpdate bloqueado');
                    };
                }
            });
        });
    }

    // =========================================================================
    // PASO 4: FORZAR POSICIÓN FIJA PERIÓDICAMENTE
    // =========================================================================
    function forceFixedPosition() {
        setInterval(function() {
            document.querySelectorAll('.modal.show .modal-dialog').forEach(function(dialog) {
                dialog.style.position = 'fixed';
                dialog.style.top = '2rem';
                dialog.style.left = '50%';
                dialog.style.transform = 'translateX(-50%)';
                dialog.style.margin = '0';
                dialog.style.willChange = 'auto';
            });
        }, 100); // Cada 100ms
    }

    // =========================================================================
    // INICIALIZAR TODO
    // =========================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            blockMouseEventsOnModals();
            observeModalPosition();
            blockBootstrapHandleUpdate();
            forceFixedPosition();
            console.log('[MODAL DEBUG] Script de depuración activado');
        });
    } else {
        blockMouseEventsOnModals();
        observeModalPosition();
        blockBootstrapHandleUpdate();
        forceFixedPosition();
        console.log('[MODAL DEBUG] Script de depuración activado');
    }

})();
