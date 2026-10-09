import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',disallow:['/admin','/api','/checkout','/cart','/track-order']},sitemap:`${process.env.NEXT_PUBLIC_SITE_URL??'http://localhost:3200'}/sitemap.xml`};}
