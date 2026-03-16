/**
 * =============================================================================
 * ELIMINAR MODAL-BACKDROP COMPLETAMENTE
 * =============================================================================
 * Este script elimina cualquier modal-backdrop que se cree
 */

(function() {
    'use strict';
    
    console.log('[REMOVE BACKDROP] Activando eliminación de backdrop...');

    // Función para eliminar todos los backdrops
    function removeAllBackdrops() {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(function(backdrop) {
            console.log('[REMOVE BACKDROP] Eliminando backdrop encontrado');
            backdrop.remove();
        });
    }

    // Eliminar inmediatamente
    removeAllBackdrops();

    // Observar y eliminar cuando se agreguen
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.classList && node.classList.contains('modal-backdrop')) {
                        console.log('[REMOVE BACKDROP] Backdrop detectado, eliminando...');
                        node.remove();
                    }
                    // También buscar dentro del nodo
                    const backdrops = node.querySelectorAll && node.querySelectorAll('.modal-backdrop');
                    if (backdrops && backdrops.length > 0) {
                        backdrops.forEach(function(backdrop) {
                            console.log('[REMOVE BACKDROP] Backdrop encontrado dentro de nodo, eliminando...');
                            backdrop.remove();
                        });
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Eliminar cada 100ms como respaldo
    setInterval(removeAllBackdrops, 100);

    // Interceptar creación de Bootstrap Modal
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const OriginalModal = bootstrap.Modal;
        bootstrap.Modal = function(element, config) {
            const instance = new OriginalModal(element, config);
            const originalShow = instance.show;
            const originalHide = instance.hide;

            instance.show = function() {
                const result = originalShow.call(this);
                setTimeout(removeAllBackdrops, 0);
                setTimeout(removeAllBackdrops, 10);
                setTimeout(removeAllBackdrops, 50);
                return result;
            };

            instance.hide = function() {
                removeAllBackdrops();
                return originalHide.call(this);
            };

            return instance;
        };
    }

    console.log('[REMOVE BACKDROP] Eliminación activa');
})();
