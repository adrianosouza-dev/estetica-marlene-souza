import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        /*
         * As bibliotecas ficam em arquivos próprios. Elas só mudam quando são
         * atualizadas, então um deploy que mexe só no site não obriga o celular
         * da cliente a baixar o React, o roteador ou o Supabase de novo.
         */
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'roteador', test: /node_modules[\\/](react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
})
