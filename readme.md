
# Poke Finder

Pokemon Finder es una aplicación web que permite a los usuarios buscar y explorar información sobre diferentes Pokémon. Utiliza la API pública PokeAPI para obtener datos sobre Pokémon y ofrece funcionalidades como búsqueda por nombre, paginación y visualización detallada de cada Pokémon.
Mirá una demo de cómo funciona acá: [Video Demo](https://youtu.be/KInfOOzzQ3U)
## Tecnologias

### Frontend
- React con TypeScript y Vite
- TailwindCSS (v4) para estilos
- Shadcn UI para componentes
- React Query para gestión de estado y cache
- Lodash para limitar llamadas a la API

### Backend
- Node.js con Express.js y TypeScript
- Redis (Upstash) para caché -- [Documentación de Upstash](https://upstash.com/docs/redis/howto/connectclient#node-js)
- Axios para llamadas a la PokeAPI
  
### Setup Redis
1. Crear una cuenta en upstash
Go to [upstash.com](https://upstash.com)
2. Registrarse en una cuenta gratuita
3. Crear base de datos
```
Nombra la base de datos (ej: poke-finder)
Seleccioná la región más cercana a tu aplicación
Seleccioná el plan gratuito.
Hacé click en "create" 
```
4. Obtené los datos de conexión
```
Buscá la sección "Connect with Redis" 
Te va a brindar tu REDIS_URL que contiene el endpoint el port y la contraseña.
```
6. Actualizá tu archivo .env

## Instalación
### Requisitos previos
```
Node.js (v14 o superior)
npm 
Cuenta en Upstash Redis (o Redis local)
```
### Backend
Navegá al directorio de backend 
```bash
  cd backend
```
Instalá las dependencias
```bash
  npm install
```
Crea un archivo .env en la raíz del directorio backend con las siguientes variables:

`PORT = 5000`

`REDIS_HOST = "localhost" `

`REDIS_PORT = 6379 `

`REDIS_PASSWORD = <tu-contraseña> `

`REDIS_URL = "rediss://default:<password>@<host>:6379" `

`POKEAPI_BASE_URL = https://pokeapi.co/api/v2`

Para correr el proyecto localmente
```bash
  npm run dev
```

Compilar el código typescript
```bash
  npm run build
```

### Frontend
Navegá al directorio del frontend 
```bash
  cd frontend
```
Instalá las dependencias
```bash
  npm install
```
Crea un archivo .env en la raíz del directorio frontend con las siguientes variables:

`VITE_API_URL = http://localhost:5000/api`
(Reemplazar por la URL de producción de ser necesario)

Para iniciar el servidor de desarrollo
```bash
  npm run dev
```
Para construir la aplicación para producción:
```bash
  npm run build
```
## Estructura del proyecto
### Backend
```
backend/
├── src/
│   ├── routes/          # Rutas de la API
│   │   └── pokemon.ts   # Endpoint para datos de Pokémon
│   ├── types/           # Definiciones de tipos
│   │   └── pokemon.ts   # Interfaces para datos de Pokémon
│   ├── utils/           # Utilidades
│   │   └── asyncHandler.ts # Manejador de funciones 
asíncronas
│   └── server.ts        # Configuración del servidor
├── .env                 # Variables de entorno
├── package.json         # Dependencias y scripts
└── tsconfig.json        # Configuración de TypeScript
```

### Frontend
```
Frontend
├── src/
│   ├── components/       # Componentes de React
│   │   ├── ui/           # Componentes UI de Shadcn
│   │   ├── PokemonCard.tsx     # Tarjeta de Pokémon
│   │   ├── PokemonList.tsx     # Lista de Pokémon
│   │   ├── Pagination.tsx      # Paginación
│   │   └── SkeletonCard.tsx    # Estado de carga
│   ├── lib/              # Utilidades
│   │   └── utils.ts      # Funciones de utilidad
│   ├── pages/       # Páginas
│   │   ├── PokemonDetailPage.tsx # Página individual
│   │   └── PokemonListPage.tsx  # Página dashboard
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Punto de entrada de React
│   └── index.css         # Estilos globales
├── .env                  # Variables de entorno
├── package.json          # Dependencias y scripts
├── tailwind.config.js    # Configuración de Tailwind
└── vite.config.ts        # Configuración de Vite
```


## Features

- Búsqueda en tiempo real de pokemon por nombre
- Debounced search para limitar llamadas a la API
- Navegación por páginas
- Prefetching de la siguiente página
- Compresión de los datos almacenados en Redis. 
- Caché basado en Redis apra resultados de búsqueda.
- Caché individual para detalles de Pókemon. 
- Carga lazy de imágenes
- Componente de Skeleton para comunicar la carga. 
- Manejo de errores
- Limitación de rate para prevenir sobrecarga de la API. 
- Diseño completamente responsive. 

## Restricciones y problemas conocidos. 
- Límite de tamaño en Redis (Plan gratuito Upstash)
- Límite de 1MB por solicitud. 
  - Implementamos compresión
  - Se redujo el tamaño de datos guardados
  - Se procesaron solicitudes por lotes pequeños. 
- Implementación de la tasa de solicitudes excesivas.

## Mejoras potenciales
- Agregar filtros adicionales
- Implementar pruebas automatizadas.
- Mejorar el manejo de errores. 
- Implementar modo oscuro

## Contacto
Para preguntas o problemas, por favor contactar a través de GitHub o abrir un issue en el repositorio.
