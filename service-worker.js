'use strict';

const CACHE_NOMBRE = 'recursos-cache-v1.0';
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
            console.log('Caché abierta');
            cache.addAll(CACHE_URL).catch(error => console.error('Error al precachear:', error));
        }
    )
    )
});

self.addEventListener('fetch', (evento) => {
    evento.respondWith(caches.match(evento.request)
        .then((respuesta) => {
            if(respuesta) {
                console.log('Recurso encontrado en el caché');
                return respuesta;
            }
            console.log('Recurso no encontrado en el caché');
            return fetch(evento.request);
        })
    );
});

//Notificaciones Push
self.addEventListener('push', (evento) => {
    const titulo = 'Lista de tareas';
    const config = {
        body: '¡No te olvides de completar tus tareas pendientes!',
        icon: 'manifest/icon192.png',
        vibrate: [100, 20, 100],
        tag: 'recordatorio',
        renotify: true,
        requireInteraction: true,
        data: {
            name: 'recordatorio-pendientes',
            url: 'index.html'
        },
        actions: [
            {
                action: 'ignorar',
                title: 'Ignorar',
            },
            {
                action: 'abrir-app',
                title: 'Ver tareas'
            }
        ]
    };

    evento.waitUntil(self.registration.showNotification(titulo, config));
})

self.addEventListener('notificationclick', (evento) => {
    evento.notification.close();
    console.log(evento.notification);

    switch(evento.action){
        case 'ignorar':
            evento.waitUntil(
                console.log('ignorar')
                //TODO: PONER WAITUNTIL EN TODOS LOS CASOS
            )
            break;
        case 'abrir-app':
            console.log('abrir app', evento.notification.data.url);
            clients.openWindow(evento.notification.data.url);
            break;
        default: 
            console.log('otros');
            break;
    };
})