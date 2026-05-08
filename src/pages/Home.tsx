import { useState } from 'react';

export default function Home() {
  const [fileName, setFileName] = useState('');

  return (
    <main className="min-h-screen bg-cream text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-10">
          <section className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center rounded-full bg-brand-light/25 px-4 py-2 text-sm font-semibold text-brand-dark">
                Partage sécurisé de fichiers
              </span>

              <div className="rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-soft sm:px-5">
                Expiration automatique, lien protégé et interface responsive.
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="max-w-2xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Téléversez, protégez et partagez vos fichiers en quelques secondes.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                Interface mobile-first et desktop, liens temporaires, taggage intelligent et mot de passe optionnel pour un partage sans compromis.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Capacité</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">1 Go</p>
                <p className="mt-2 text-sm text-slate-600">Taille maximale par fichier</p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Sécurité</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">Mot de passe</p>
                <p className="mt-2 text-sm text-slate-600">Optionnel, haché côté serveur</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="mb-8 space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-brand">Téléversement</p>
              <h2 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Principes du téléversement</h2>
              <p className="text-sm text-slate-600 sm:text-base">
                Upload sécurisé, validation côté serveur et gestion des accès.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3">
                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand/10 text-3xl text-brand">
                    +
                  </div>
                  <div className="max-w-sm">
                    <p className="font-semibold text-slate-900">
                      Glissez-déposez ou cliquez pour sélectionner un fichier
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      1 Go max · .exe/.bat/.sh/.msi/.cmd/.ps1 interdits
                    </p>
                  </div>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) setFileName(file.name);
                    }}
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-[1.75rem] bg-cream/80 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Fichier sélectionné</p>
                    <p className="text-sm text-slate-600">{fileName || 'Aucun fichier'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    Étape 1
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Expiration</label>
                    <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900">
                      <option value="7">7 jours</option>
                      <option value="5">5 jours</option>
                      <option value="3">3 jours</option>
                      <option value="1">1 jour</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                    <input
                      type="password"
                      placeholder="6 caractères minimum"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tags</label>
                  <input
                    type="text"
                    placeholder="ex. projet, rapport"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                  <p className="text-xs text-slate-500">30 caractères max par tag, dédoublonnés automatiquement.</p>
                </div>
              </div>

              <button className="w-full rounded-3xl bg-brand px-6 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark">
                Téléverser en toute sécurité
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
