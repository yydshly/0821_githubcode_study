import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ArchitectureMap from '../../upstream/architecture-map/assets/components/ArchitectureMap'
import '../../upstream/architecture-map/assets/components/keyframes.css'
import { ARCHITECTURE } from './graph'
import './demo.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ArchitectureMap data={ARCHITECTURE} />
  </StrictMode>,
)
