import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileDown,
  Printer,
  Search,
  Share2,
  ShieldCheck,
  Sliders,
  Trash2,
} from 'lucide-react';
import {
  type ConfigCategory,
  type PlatformTarget,
  type SensitivityConfig,
  formatFreeFireConfig,
} from '../lib/optimizer';
import { type PdfThemeMode, exportConfigToBrandedPdf } from '../lib/pdfExport';
import { createSignedBundle } from '../lib/security';
import { triggerHaptic } from '../lib/haptics';
import { copyTextSafely } from '../lib/clipboard';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

interface ConfigVaultViewProps {
  configs: SensitivityConfig[];
  activeConfigId: string;
  platform: PlatformTarget;
  targetFps: number;
  onLoadConfig: (config: SensitivityConfig) => void;
  onDeleteCustom: (id: string) => void;
}

const FILTERS: { id: 'all' | ConfigCategory; label: string }[] = [
  { id: 'all', label: 'All Configs' },
  { id: 'headshot', label: 'Headshot' },
  { id: 'smg', label: 'SMG Rush' },
  { id: 'recoil', label: 'AR Zero-Recoil' },
  { id: 'sniper', label: 'Sniper' },
  { id: 'lowend', label: 'Low-End' },
  { id: 'custom', label: 'My Saved' },
];

export const ConfigVaultView: React.FC<ConfigVaultViewProps> = ({
  configs,
  activeConfigId,
  platform,
  targetFps,
  onLoadConfig,
  onDeleteCustom,
}) => {
  const [filter, setFilter] = useState<'all' | ConfigCategory>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pdfSavedId, setPdfSavedId] = useState<string | null>(null);
  const [pdfTheme, setPdfTheme] = useState<PdfThemeMode>('digital');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return configs.filter((c) => {
      if (filter !== 'all' && c.category !== filter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.weapons.some((w) => w.toLowerCase().includes(q)) ||
        c.recoilNotes.toLowerCase().includes(q)
      );
    });
  }, [configs, filter, query]);

  const handleCopy = async (config: SensitivityConfig) => {
    triggerHaptic('success');
    await copyTextSafely(formatFreeFireConfig(config, platform, targetFps));
    setCopiedId(config.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportBundle = async (config: SensitivityConfig) => {
    triggerHaptic('action');
    const bundle = await createSignedBundle(config);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.id}.pasiya.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = (config: SensitivityConfig) => {
    triggerHaptic('success');
    exportConfigToBrandedPdf(config, platform, targetFps, pdfTheme);
    setPdfSavedId(config.id);
    setTimeout(() => setPdfSavedId(null), 2200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Aim Stability &amp; Recoil Config Vault
          </h1>
          <p className="mt-1 text-sm text-[#9A9AA6]">
            Curated weapon recoil profiles &amp; server-signed custom configs
          </p>
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="w-4 h-4 text-[#9A9AA6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="vault-search" className="sr-only">
            Search configs or weapons
          </label>
          <input
            id="vault-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weapon (MP40, SCAR, AWM)..."
            className="w-full min-h-[42px] pl-10 pr-4 rounded-xl bg-[#0B0B0F] border border-[#23232B] text-sm text-white placeholder:text-[#6E6E7A] focus:outline-none focus:border-[#EF4444]"
          />
        </div>
      </div>

      {/* Filter Tabs & PDF Guide Edition Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        <SlidingSegmentedControl<'all' | ConfigCategory>
          ariaLabel="Configuration category filters"
          variant="crimson"
          layout="scrollable"
          className="rounded-2xl p-1.5 max-w-full"
          pillRadiusClass="rounded-xl"
          buttonClassName="min-h-[38px]"
          value={filter}
          onChange={setFilter}
          options={FILTERS}
        />

        <SlidingSegmentedControl<PdfThemeMode>
          ariaLabel="PDF guide edition"
          variant={pdfTheme === 'print' ? 'white' : 'crimson'}
          className="self-start xl:self-auto shrink-0"
          buttonClassName="min-h-[34px] px-3 py-1"
          value={pdfTheme}
          onChange={setPdfTheme}
          options={[
            {
              id: 'digital',
              testId: 'pdf-mode-digital',
              label: (
                <>
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Share Dark PDF
                </>
              ),
            },
            {
              id: 'print',
              testId: 'pdf-mode-print',
              label: (
                <>
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  Print Clean PDF
                </>
              ),
            },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="ios-panel-glide rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-10 text-center">
          <p className="text-sm font-medium text-white">
            No matching configs found
          </p>
          <p className="mt-1 text-xs text-[#9A9AA6]">
            Clear your search filter or save a custom profile in the Sensitivity tab.
          </p>
        </div>
      ) : (
        <div
          key={filter}
          className="ios-panel-glide grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {filtered.map((config) => {
            const isActive = config.id === activeConfigId;
            return (
              <article
                key={config.id}
                className={`rounded-2xl bg-[#0B0B0F] border p-5 flex flex-col justify-between transition-colors ${
                  isActive ? 'border-[#EF4444]' : 'border-[#23232B]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {config.name}
                      </h2>
                      <div className="mt-1 text-xs text-[#9A9AA6]">
                        {config.weapons.join(' · ')} · {config.cap}-Cap
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E] shrink-0">
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>{config.signature ? 'HMAC Signed' : 'Local'}</span>
                    </div>
                  </div>

                  {/* Numeric Readout Grid */}
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    {[
                      ['GEN', config.general],
                      ['RED', config.redDot],
                      ['2X', config.x2],
                      ['4X', config.x4],
                    ].map(([lbl, val]) => (
                      <div
                        key={lbl}
                        className="rounded-lg bg-[#060609] border border-[#23232B] py-2"
                      >
                        <div className="text-[10px] text-[#9A9AA6]">{lbl}</div>
                        <div className="text-sm font-bold font-mono-num text-white">
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-[#C4C4CF] leading-relaxed">
                    <strong className="text-white">Aim Stability:</strong>{' '}
                    {config.recoilNotes}
                  </div>
                  <div className="mt-1.5 text-xs text-[#9A9AA6] leading-relaxed">
                    <strong className="text-white">Drag Cue:</strong>{' '}
                    {config.dragCue}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#23232B] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadConfig(config)}
                    className={`min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#050507] hover:bg-[#E5E5EC]'
                        : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                    {isActive ? 'Loaded in Tuner' : 'Apply Config'}
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopy(config)}
                      aria-label={`Copy ${config.name} settings`}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131A] border border-[#2A2A34] text-xs font-medium text-white hover:border-[#EF4444]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedId === config.id ? (
                        <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedId === config.id ? 'Copied' : 'Copy'}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleExportBundle(config)}
                      aria-label={`Export signed ${config.name} bundle`}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131A] border border-[#2A2A34] text-xs font-medium text-white hover:border-[#EF4444]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>

                    <button
                      type="button"
                      data-testid={`export-pdf-${config.id}`}
                      onClick={() => handleExportPdf(config)}
                      aria-label={`Download ${config.name} branded PDF settings guide`}
                      className="ff-btn-sheen min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-[#050507] text-xs font-bold hover:bg-[#E5E5EC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {pdfSavedId === config.id ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                      )}
                      {pdfSavedId === config.id ? 'PDF Downloaded' : 'Download PDF'}
                    </button>

                    {config.source === 'custom' && (
                      <button
                        type="button"
                        onClick={() => onDeleteCustom(config.id)}
                        aria-label={`Delete ${config.name}`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-[#13131A] border border-[#2A2A34] text-[#EF4444] hover:bg-[#261015] transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
