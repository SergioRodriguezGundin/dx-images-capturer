---
description: Implementación de la capa de adquisición de datos de alta velocidad y aislamiento de procesos. Utilizaremos la API nativa de Windows para obtener el cuadro grande de colores que se mueve (la pantalla del juego) y lo enviaremos a un ayudante separado 
---

1 Captura Nativa con Windows.Graphics.Capture
En lugar de sacar una "foto" lenta de la pantalla, usaremos un flujo directo de la tarjeta de video. Es como conectar una manguera de datos que nos da los píxeles brillantes sin que la CPU tenga que trabajar.

Pasos de Implementación:
Inicialización del Contexto de Gráficos (Direct3D11):

En Rust, configurar un dispositivo ID3D11Device. Esto nos da permiso para entrar en la "fábrica de dibujos" de la tarjeta de video.

Configuración del FramePool:

Crear una piscina de cuadros (buffer). Solo guardaremos 1 o 2 cuadros de la imagen llena de colores a la vez para no llenar la memoria.

Rigor Técnico: Implementar el manejador de eventos FrameArrived. Cada vez que el juego dibuja algo nuevo, nuestra aplicación recibe un aviso instantáneo.

Manejo de "Cosas que cambian de tamaño":

Si el usuario hace la ventana del juego más grande o más pequeña, el capturador debe reiniciarse solo para ajustarse al nuevo tamaño del cuadro.

2 Gestión del Sidecar de Roboflow (Aislamiento)
No queremos que el "cerebro" que busca el dibujo de la estrella dorada (objeto legendario) esté dentro de nuestra aplicación principal. Si el cerebro se cansa y se apaga, la aplicación debe seguir viva.

Pasos de Implementación:
Configuración de tauri.conf.json:

Declarar el binario de Roboflow como un sidecar. Esto le dice a Tauri: "Lleva a este amigo contigo cuando te instales".

Arranque del Proceso Hijo:

Al abrir la app, Rust lanza el proceso del Sidecar.

Seguridad de Google: El Sidecar corre con "privilegios mínimos". Solo puede ver las imágenes que le pasamos y nada más.

Comunicación por Tubería (Named Pipes):

Como el Sidecar es un ayudante que vive en otra habitación, usamos una "tubería" (pipe) para pasarle los cuadros de colores. Es mucho más rápido que enviarlo por internet o por red local.

3 Filtro de "Mirada Inteligente" (Dynamic Crop)
Para ir aún más rápido, no le pediremos al cerebro que mire toda la pantalla. Solo le pediremos que mire el cuadradito pequeño de la esquina donde suelen aparecer los objetos.

Pasos de Implementación:
Definir Zonas de Interés (ROI):

Si buscamos la vida, solo miramos la barrita roja larga.

Si buscamos ítems, solo miramos los cuadrados pequeños de abajo.

Recorte en Memoria (Zero-Copy):

En lugar de copiar la imagen y cortarla (lo cual es lento), solo le decimos al cerebro: "Empieza a leer desde el píxel 100 y termina en el 200".

4. Criterios de Aceptación (DoD)
[ ] La captura de pantalla usa menos del 1% de la CPU.

[ ] El Sidecar de Roboflow se inicia y se cierra junto con la aplicación principal (no se quedan "procesos zombie").

[ ] El sistema detecta correctamente si el usuario cambia de ventana (Alt-Tab) y deja de capturar para ahorrar energía.

5. Notas de Ingeniería (Google Standards)
Robustez: Implementar un sistema de "latido" (heartbeat). Si el Sidecar no responde en 5 segundos, Rust lo reinicia automáticamente.

Eficiencia: Usar el formato de color B8G8R8A8_UIntNormalized. Es el lenguaje nativo de los píxeles de colores en Windows y no requiere conversión.