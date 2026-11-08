import React from 'react'
import { useParams } from 'react-router-dom'
import { useStore, CATS } from '../lib/store'
import { TopBar, ProductCard, Empty } from '../components/ui'

export default function Cat() {
  const { cat = '' } = useParams()
  const { products } = useStore()
  const items = products.filter(p => p.cat === cat)
  return (
    <div className="pb-28">
      <TopBar title={(CATS.find(x => x.id === cat) as any)?.[useStore().lang] || cat} />
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-4">
        {items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
      </div>
      {items.length === 0 && <Empty emoji="🍽" title="Bo'sh" />}
    </div>
  )
}
export function CatFallback() { return <div className="p-6" /> }
export const CATS_EXPORT = CATS
