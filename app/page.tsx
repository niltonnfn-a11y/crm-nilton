import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-3 text-3xl font-semibold text-slate-900">CRM</h1>
        <p className="mb-8 max-w-md text-slate-600">
          Organize seus contatos e negócios em um só lugar.
        </p>
        <Link
          href="/login"
          className="rounded bg-slate-900 px-6 py-2 text-white hover:bg-slate-800"
        >
          Entrar
        </Link>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">
        <p>NFN Tecnologia - CNPJ: 31.425.806/0001-55</p>
        <p>E-mail: nfntecnologia@seuminisitio.com.br</p>
        <p>Endereço: R. Alcaide Mór Camargo, 95 - Taubaté/SP - CEP 12010-240</p>
      </footer>
    </div>
  )
}
