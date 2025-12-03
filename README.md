This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuración de entorno (YouTube API)

Para que el buscador de YouTube funcione en `dev`, `build` y `start`, debes configurar la variable de entorno `YOUTUBE_API_KEY`.

1. Crea un archivo `.env.local` en la raíz del proyecto.
2. Copia desde `.env.example` y coloca tu clave real: `YOUTUBE_API_KEY=...`.
3. La clave debe ser válida y con restricciones de API adecuadas (por ejemplo, restricciones por Referer o IP). Si restringes por Referer, asegúrate de incluir el dominio donde desplegas (ej. `http://localhost:3000` en local y tu dominio en producción).

Notas importantes:
- Esta clave se usa sólo en el servidor (API route en `src/app/api/search/route.js`). No la expongas como `NEXT_PUBLIC_`.
- Al ejecutar `next build` y luego `next start`, la variable debe estar disponible en el entorno del proceso de `start`.
- En Vercel u otro hosting, configura `YOUTUBE_API_KEY` en las variables de proyecto (Production/Preview/Development) en el panel.

Si la clave no está configurada, el endpoint devolverá un error y la UI mostrará un mensaje indicando el problema.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
