import { TIERS } from '@/data/tiers';
import { t } from '@/i18n/translations';
import type { LanguageCode, Doctor, TierInfo, PricingTier } from '@/types';
import { ArrowLeft, MessageSquare, Phone, Video, Check, Shield, Clock } from 'lucide-react';
import { useState } from 'react';

interface Props {
  lang: LanguageCode;
  doctor: Doctor;
  onBack: () => void;
  onSelectTier: (tier: TierInfo) => void;
}

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  essential: MessageSquare,
  essential_plus: MessageSquare,
  audio: Phone,
  video: Video,
};

const TIER_BADGES: Record<PricingTier, string | null> = {
  essential: null,
  essential_plus: 'recommended',
  audio: 'popular',
  video: 'bestValue',
};

export default function PricingScreen({ lang, doctor, onBack, onSelectTier }: Props) {
  const [selected, setSelected] = useState<PricingTier | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/30">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-slate-800 text-base">{t(lang, 'choosePlan')}</h1>
            <p className="text-xs text-slate-400">{doctor.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-8 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">{t(lang, 'choosePlan')}</h2>
          <p className="text-sm text-slate-400 mt-1">{t(lang, 'choosePlanSubtitle')}</p>
        </div>

        <div className="space-y-4">
          {TIERS.map(tier => {
            const Icon = TIER_ICONS[tier.id] || MessageSquare;
            const badge = TIER_BADGES[tier.id];
            const isTextTier = tier.type === 'text';
            const isSelected = selected === tier.id;
            const price = doctor.prices?.[tier.id] ?? tier.price;

            return (
              <button
                key={tier.id}
                onClick={() => setSelected(tier.id)}
                className={`w-full bg-white rounded-2xl p-5 border-2 text-left transition-all relative ${
                  isSelected
                    ? 'border-teal-400 ring-2 ring-teal-100 shadow-lg shadow-teal-100/50'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {badge && (
                  <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {t(lang, badge)}
                  </span>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-teal-100' : 'bg-slate-50'
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-slate-800 text-base">
                          {tier.id === 'essential' ? `${t(lang, 'tier1Title')} - ${t(lang, 'essential')}` : ''}
                          {tier.id === 'essential_plus' ? `${t(lang, 'tier1Title')} - ${t(lang, 'essentialPlus')}` : ''}
                          {tier.id === 'audio' ? t(lang, 'tier2Title') : ''}
                          {tier.id === 'video' ? t(lang, 'tier3Title') : ''}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xl font-bold text-slate-800">
                          <span className="text-sm text-slate-400 font-normal">₹</span>{price}
                        </span>
                      </div>
                    </div>

                    {/* Text/Image counts ONLY for text tiers (Tier 1) */}
                    {isTextTier && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {tier.texts} {t(lang, 'texts')}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                          {tier.images} {t(lang, 'images')}
                        </span>
                      </div>
                    )}

                    {/* Tier 2 & 3: show duration only, NO text/image counts or ₹100/₹150 tags */}
                    {!isTextTier && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                          {tier.type === 'audio' ? t(lang, 'audioDuration') : t(lang, 'videoDuration')}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Shield className="w-3.5 h-3.5" />
                          {t(lang, 'verified')}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-2">{t(lang, 'pricePerSession')}</p>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (selected) {
              const tier = TIERS.find(t => t.id === selected);
              if (tier) onSelectTier({ ...tier, price: doctor.prices?.[tier.id] ?? tier.price });
            }
          }}
          disabled={!selected}
          className={`w-full mt-6 font-semibold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
            selected
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-teal-500/30 hover:shadow-teal-500/40 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {t(lang, 'proceedToPay')}
        </button>
      </div>
    </div>
  );
}
