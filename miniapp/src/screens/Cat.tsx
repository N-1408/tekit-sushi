import React from 'react'
import { useParams } from 'react-router-dom'
import { useStore, pName, CATS } from '../lib/store'
import { TopBar, SearchChips, ProductCard, Empty, MenuToggle } from '../components/ui'

export default function Cat() {
  const { cat = '' } = useParams()
  const { products, lang } = useStore()
  const [q, setQ] = React.useState('')
  const c: any = CATS.find(x => x.id === cat)
  let items = products.filter(p => p.cat === cat)
  if (q.trim()) items = items.filter(p => pName(p, lang).toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div className="pb-28 lg:pb-12">
      <div className="sticky top-0 z-30 bg-[var(--bg)]" style={{ paddingTop: 'calc(6px + var(--sat))' }}>
        <TopBar flat title={(c as any)?.[lang] || c?.id || cat} />
        <SearchChips q={q} setQ={setQ} />
      </div>
      <div className="lg:max-w-[1240px] lg:mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-7 px-4 lg:px-6 mt-4">
          {items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
        </div>
        {items.length === 0 && <div className="px-4"><Empty title="Bo'sh" /></div>}
      </div>
    </div>
  )
}
export function CatFallback() { return <div className="p-6" /> }
