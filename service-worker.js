'use strict';

const CACHE_NOMBRE = 'recursos-cache-v1.1';
const CACHE_URL = [
    './',
    'index.html',
    'assets/icon/favicon.ico',
    'assets/icon/eliminar.png',
    'assets/icon/notificacion.png',
    'assets/icon/descargas.png',
    'assets/font/fjallaone-regular.ttf',
    'estilo/estilo.css',
    'estilo/bootstrap.min.css',
    'js/js.js',
    'js/bootstrap.bundle.min.js',
    'manifest/manifest.json',
    'manifest/icon512_maskablee.png',
    'manifest/icon512_rounded.png'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(caches.open(CACHE_NOMBRE)
        .then((cache) => {
            console.log('caché abierta');
            cache.addAll(CACHE_URL).catch(error => console.error('Error al precachear:', error));
        }
    )
    )
});

self.addEventListener('fetch', (evento) => {
    console.log('Fetch interceptado para: ', evento.request.url);
    evento.respondWith(caches.match(evento.request)
        .then((respuesta) => {
            if(respuesta) {
                console.log('Recurso encontrado');
                return respuesta;
            }
            console.log('Recurso no encontrado');
            return fetch(evento.request);
        })
    );
});