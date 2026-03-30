# Cortexa - Tu Segundo Cerebro Inteligente

Cortexa es una aplicación de gestión del conocimiento de última generación, diseñada para ayudarte a organizar tus pensamientos, resumir información y encontrar respuestas al instante utilizando Inteligencia Artificial.

## Características Principales

- **Gestión de Notas Inteligente:** Crea, edita y organiza tus notas con soporte para Markdown.
- **Módulos IA:**
  - **Resumen Automático:** Genera resúmenes concisos de tus notas largas.
  - **Sugerencia de Etiquetas:** IA que analiza tu contenido y sugiere etiquetas relevantes.
  - **Reescritura de Contenido:** Mejora la claridad, cambia el tono o traduce tus notas.
  - **Extracción de Tareas:** Identifica automáticamente tareas pendientes dentro de tus textos.
  - **Conexiones Inteligentes:** Sugiere enlaces entre notas relacionadas semánticamente.
- **Visualización Avanzada:**
  - **Cerebro Digital (Grafo):** Visualiza las conexiones entre tus ideas en un mapa interactivo.
  - **Tablero Kanban:** Organiza tus notas y tareas por estado.
  - **Línea de Tiempo:** Explora tu historial de pensamiento cronológicamente.
  - **Workspace Inteligente:** Un panel de control con estadísticas y sugerencias contextuales.
- **Captura Inteligente:** Sube imágenes, audios o documentos y deja que la IA los convierta en notas estructuradas.
- **Búsqueda Semántica:** Encuentra lo que buscas por su significado, no solo por palabras clave.
- **Responsive Design:** Optimizado para todos los dispositivos (móvil, tablet y escritorio).
- **Colaboración en Tiempo Real:** Sincronización instantánea y presencia de usuarios.

## Arquitectura del Proyecto (MVC)

El proyecto sigue un patrón de arquitectura Modelo-Vista-Controlador (MVC) para una mejor organización y mantenibilidad:

- **src/models/**: Define las estructuras de datos y el estado global.
  - `types.ts`: Interfaces y tipos de TypeScript.
  - `store/`: Gestión de estado con Zustand (useNoteStore, useUserStore).
- **src/controllers/**: Lógica de negocio y servicios externos.
  - `services/`: Integraciones con APIs (Gemini AI, etc.).
- **src/views/**: Componentes de la interfaz de usuario.
  - `components/`: Componentes React reutilizables y vistas modales.
- **src/App.tsx**: Componente principal que orquestra la navegación y el layout.
- **src/firebase.ts**: Configuración y servicios de Firebase (Auth, Firestore).

## Tecnologías Utilizadas

- **Frontend:** React, TypeScript, Vite.
- **Estilos:** Tailwind CSS.
- **Estado:** Zustand.
- **Base de Datos y Auth:** Firebase (Firestore, Authentication).
- **IA:** Google Gemini SDK (@google/genai).
- **Animaciones:** Framer Motion.
- **Iconos:** Lucide React.
- **Visualización:** D3.js.

## Información del Sistema

- **Autor:** Miguel J. Mogrovejo Cardenas
- **Versión:** 1.0.0
- **Licencia:** MIT

---
Desarrollado con ❤️ para potenciar la mente humana.
