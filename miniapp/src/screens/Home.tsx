import React from 'react'
import { useStore, pName, CATS, type Product } from '../lib/store'
import { Header, SearchChips, CityBanner, HeroSlider, InfoTiles, ProductCard } from '../components/ui'

function Section({ title, items }: { title: string; items: Product[] }) {
  if (!items.length) return null
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-4 lg:px-6 mb-3">
        <h2 className="text-[19px] lg:text-[22px] font-extrabold tracking-tight">{title}</h2>
        <span className="text-[11px] font-extrabold text-[#A2A9C6]">{items.length}</span>
      </div>
      <div className="px-4 lg:px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
        {items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
      </div>
    </section>
  )
}

export default function Home() {
  const { t, lang, products } = useStore()
  const [q, setQ] = React.useState('')
  const hits = products.filter(p => p.hit)
  const sales = products.filter(p => (p as any).sale_active && ((p as any).old_price ?? 0) > p.price)
  const found = q.trim() ? products.filter(p => pName(p, lang).toLowerCase().includes(q.trim().toLowerCase())) : null

  return (
    <div className="pb-28 lg:pb-12">
      <div className="sticky top-0 z-30" style={{ paddingTop: 'calc(6px + var(--sat))' }}>
        <Header />
        <SearchChips q={q} setQ={setQ} />
      </div>
      <div className="lg:max-w-[1240px] lg:mx-auto">
        <CityBanner />
        {found ? (
          <section className="px-4 lg:px-6 mt-4">
            {found.length === 0 ? (
              <div className="py-10 text-center text-[14px] font-semibold text-[#8A93B8]">— {t.noResults} —</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                {found.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
              </div>
            )}
          </section>
        ) : (
          <>
            <HeroSlider />
            <InfoTiles />
            <Section title={t.aSaleHome} items={sales} />
            <Section title={t.hit} items={hits} />
            {CATS.map(c => {
              const list = products.filter(p => p.cat === c.id)
              return <Section key={c.id} title={(c as any)[lang] || t.catNames[c.id]} items={list} />
            })}
          </>
        )}
      </div>
    </div>
  )
}
