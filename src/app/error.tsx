'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="section empty"><h1>Vamos tentar de novo?</h1><p>Não foi possível carregar esta página. Sua sacola continua salva.</p><button className="button" onClick={reset}>Tentar novamente</button></div>;}
