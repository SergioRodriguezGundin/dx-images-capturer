---
description: Implementación de la capa de visualización y ejecución de tareas automatizadas en Angular 21. Esta capa actúa como el receptor final de la telemetría procesada por Rust, encargándose de ejecutar las "Tareas X" y actualizar la interfaz de usuario medi
---

1 Servicio de Telemetría (Tauri Event Listener)
En lugar de preguntar constantemente si hay novedades, crearemos un servicio que se quede "escuchando" de forma pasiva. Es como tener un cartero esperando a que Rust le entregue un sobre con información.

Pasos de Implementación:
Inyección del API de Tauri:

Utilizar el paquete @tauri-apps/api/event para vincular el backend con el frontend.

Creación del Listener Global:

Configurar un listen que capture el evento "game-state-change".

Rigor Técnico: El listener debe ejecutarse fuera de la zona de Angular (si aún se usa Zone.js) para evitar disparar detecciones de cambios innecesarias en toda la página.

2 Gestión de Estado con Angular 21 (Signals)
Para que la aplicación sea muy rápida, usaremos Signals. Esto hace que cuando recibamos un dato, solo cambie el dibujo pequeño que nos interesa y no toda la ventana.

Pasos de Implementación:
Definición de Señales de Estado:

healthStatus = signal<'healthy' | 'critical'>('healthy'): Para saber si la barrita roja de arriba está larga o se ha vuelto muy cortita.

lastItemFound = signal<string | null>(null): Para guardar cuando vemos un dibujo brillante con forma de estrella naranja (objeto legendario).

Computed Signals para Tareas Automáticas:

Usar computed() para derivar estados. Por ejemplo, una señal que se active solo cuando la salud es crítica y haya un objeto peligroso cerca.

TypeScript
// Ejemplo de lógica en Angular 21
readonly isPanicMode = computed(() => 
  this.healthStatus() === 'critical' && this.enemyDetected()
);

3 Ejecutor de "Tareas X" (Action Engine)
Aquí es donde la aplicación hace cosas de verdad basándose en lo que ve el "cerebro".

Pasos de Implementación:
Trigger de Acciones:

Crear un effect() que vigile las señales.

Acción 1 (Salud Baja): Si la barrita roja se pone parpadeante, el efecto puede disparar un sonido de alerta o cambiar el borde de la ventana a color rojo brillante.

Acción 2 (Objeto Legendario): Si aparece el dibujo naranja con picos, la aplicación puede guardar automáticamente un clip de video o enviar un mensaje de "¡Lo encontré!" al chat.

Desacoplamiento de Tareas Pesadas:

Si la "Tarea X" implica escribir en un archivo o hacer una petición web, se debe delegar de vuelta al backend de Rust mediante un invoke('task_x_command') para no congelar la pantalla.

4. Criterios de Aceptación (DoD)
[ ] La interfaz de Angular mantiene 60 FPS constantes mientras recibe eventos de telemetría.

[ ] El cambio de estado de "Salud Normal" a "Salud Crítica" se refleja en menos de 16ms (1 frame) en el frontend.

[ ] Se implementa un sistema de "Logs de Eventos" para ver en tiempo real qué ha detectado el sistema de visión.

5. Notas de Ingeniería (Google Standards)
Limpieza de Memoria: Es obligatorio cancelar la suscripción al listener de Tauri cuando el componente de Angular se destruye (ngOnDestroy) para evitar fugas de memoria.

Seguridad de Tipos: Todos los eventos recibidos desde Rust deben estar tipados estrictamente en TypeScript para evitar errores de ejecución cuando el modelo de Roboflow cambie su formato de salida.