---
description: Implementación del marco de monitoreo y pruebas de estrés para el pipeline de telemetría. El objetivo es medir la latencia "Pixel-to-Action" (desde que el juego cambia hasta que Angular reacciona) y asegurar que el consumo de recursos se mantenga den
---

1 Monitoreo de Latencia de Extremo a Extremo
Debemos saber exactamente cuánto tarda el mensaje en viajar. Si el sistema tarda mucho en darse cuenta de que el dibujo del círculo verde se ha apagado (el poder está listo), el usuario perderá la ventaja competitiva.

Pasos de Implementación:
Timestamping de Alta Resolución:

Usar std::time::Instant en Rust para marcar el momento exacto en que capturamos el cuadro lleno de colores de la pantalla.

Inyección de Metadatos en el Payload:

Adjuntar el tiempo de inicio al mensaje JSON que viaja hacia Angular.

Cálculo de Latencia en el Frontend:

En Angular 21, comparar el tiempo actual con el del mensaje. Si la diferencia es mayor a 100ms, disparar una alerta de "Rendimiento Degradado".

2 Pruebas de Estrés y "Fuga de Colores" (Memory Leaks)
Los juegos pueden durar horas. Nuestra app debe ser capaz de procesar millones de cuadros de colores sin cansarse ni llenar la memoria de la computadora.

Pasos de Implementación:
Simulador de Video (Mock Feed):

Crear un modo "Laboratorio" donde, en lugar de capturar el juego, Rust lea un archivo de video en bucle.

Esto nos permite probar si el sistema reconoce siempre la barrita roja que se hace pequeña de la misma manera, sin importar cuánto tiempo pase.

Pruebas de Carga Térmica:

Ejecutar el Sidecar de Roboflow al 100% de su capacidad durante 2 horas y monitorear la temperatura de la GPU mediante la API de Windows.

Rigor Técnico: Si la temperatura sube demasiado, Rust debe ordenar al capturador reducir la velocidad (de 60 FPS a 30 FPS) para dejar que la computadora se enfríe.

3 Logs de "Visión del Robot" (Observabilidad)
Para saber por qué el sistema falló, necesitamos una "caja negra" que nos diga qué estaba viendo la app en ese momento.

Pasos de Implementación:
Registro de Detecciones Falsas:

Si el sistema cree ver un objeto brillante con picos (legendario) pero el usuario dice que no está, guardamos ese pequeño recorte de imagen para re-entrenar el modelo de Roboflow.

Dashboard de Salud del Sistema:

Crear una pestaña oculta en Angular 21 que muestre gráficas de:

FPS de la captura.

Tiempo de pensamiento del "cerebro" (Inferencia).

Uso de RAM de Rust vs. el Sidecar.

4. Criterios de Aceptación (DoD)
[ ] La aplicación consume menos de 250MB de RAM total (Tauri + Sidecar + Angular).

[ ] El sistema de logs no escribe más de 10MB por hora para no llenar el disco duro del usuario.

[ ] Se ha validado que la app puede funcionar durante 5 horas seguidas sin crashear ni ralentizar el sistema.

5. Notas de Ingeniería (Google Standards)
Principio de "Silencio por Defecto": La telemetría solo debe molestar al usuario si detecta un error crítico. Mientras todo vaya bien, el sistema debe trabajar en las sombras.

Privacidad: Asegurarse de que ninguna de las imágenes de los cuadros de colores que capturamos se envíe a internet sin permiso explícito del usuario. Todo el análisis debe ser local.