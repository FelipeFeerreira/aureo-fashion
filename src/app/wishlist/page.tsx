import {db} from '@/lib/db';import {fashionInclude} from '@/lib/fashion/catalog';import {productView} from '@/lib/fashion/view';import {Wishlist} from '@/components/fashion/product';
export const metadata={title:'Favoritos'};
export default async function Page(){const products=await db.product.findMany({where:{archived:false,categoryId:{not:null}},include:fashionInclude});return <div className="section"><div className="catalog-title"><span className="eyebrow">PARA REENCONTRAR</span><h1>Seus favoritos.</h1></div><Wishlist products={products.map(productView)}/></div>;}
