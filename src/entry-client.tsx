import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

const router = getRouter()

const root = document.getElementById('app')!
createRoot(root).render(<RouterProvider router={router} />)
