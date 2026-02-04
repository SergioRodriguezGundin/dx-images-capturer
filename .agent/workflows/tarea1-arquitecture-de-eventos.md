---
description: Implementación del sistema de mensajería asíncrona entre el backend de Rust (Tauri) y el frontend de Angular 21. El objetivo es procesar el flujo de píxeles del juego sin bloquear el hilo principal y notificar cambios de estado críticos mediante un p
---

1. Implementación de Canales MPSC (Rust Core)
El sistema debe gestionar la "contrapresión" (backpressure). Si el modelo de visión tarda en procesar, descartamos frames antiguos para priorizar la realidad actual del juego.

Pasos de Implementación:
Definir el Buffer de Imagen: * Crear una estructura RawFrame que contenga el vector de bytes de la imagen.

Incluir metadatos: timestamp, width, height.

Configurar el Canal Bounded (Limitado):

Usar tokio::sync::mpsc::channel::<RawFrame>(5).

Lógica de Descarte: Si el canal está lleno, el productor debe liberar el frame anterior antes de enviar el nuevo.

Desarrollar el Worker de Inferencia (Consumidor):

Crear un loop asíncrono que extraiga frames del canal.

Llamar al Sidecar de Roboflow para buscar patrones específicos, como cuando la barrita de color rojo de arriba se hace muy cortita (indicador de salud baja).

2 Puente de Eventos Tauri ↔ Angular 21
Transformación de datos crudos de visión en eventos de negocio para el usuario.

Pasos de Implementación:
Serialización de Eventos en Rust:

Crear un Enum GameEvent para tipar las detecciones.

Ejemplo: HealthWarning, ItemDetected.

Emisión de Eventos (tauri::Emitter):

Cuando el modelo detecta un objeto que brilla mucho con color amarillo y tiene picos (un objeto legendario), invocar window.emit("game-state-change", payload).

Configuración de Seguridad (Capabilities):

Modificar el archivo src-tauri/capabilities/main.json para permitir la emisión de eventos personalizados hacia el frontend.

3 Integración Reactiva en Angular 21 (Signals)
Uso de las capacidades modernas de Angular para una interfaz que reaccione en microsegundos.

Pasos de Implementación:
Crear el GameTelemetryService:

Inyectar el listener de Tauri: import { listen } from '@tauri-apps/api/event'.

Definir Signals de Estado:

public currentHealth = signal<number>(100);

public legendaryFound = signal<boolean>(false);

Suscripción y Actualización:

Al recibir el evento de Rust, actualizar el Signal correspondiente. Esto asegura que solo se repinte el componente que muestra el dibujo circular de color verde o la alerta roja.

4. Criterios de Aceptación (DoD)
[ ] El canal de Rust no excede los 100MB de consumo de RAM bajo carga.

[ ] La latencia desde la detección del cuadro de colores que se mueve hasta la actualización en Angular es < 150ms.

[ ] El frontend no sufre bloqueos de frames (mantiene 60 FPS) durante la inferencia.

5. Notas de Ingeniería (Google Standards)
Observabilidad: Cada evento enviado a Angular debe incluir un ID de correlación para trazar la latencia end-to-end.

Resiliencia: Si el proceso Sidecar de Roboflow se reinicia, el canal MPSC debe reconectarse automáticamente sin tirar la aplicación de Tauri.