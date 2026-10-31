import {createRoot,hydrateRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
import './guestbook.css';
import './photos-mobile.css';
import './dialog-motion.css';
import './audit-polish.css';
import './photo-layout.css';
import './compact-layout.css';
import './portfolio-editorial.css';
import './unified-hero-links.css';
import './discovery-labs.css';

const root=document.getElementById('root')!;
if(root.hasChildNodes())hydrateRoot(root,<App/>);
else createRoot(root).render(<App/>);
