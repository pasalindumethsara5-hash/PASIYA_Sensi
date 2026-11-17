import React from 'react';
import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import {
  OWNER_CONTACT,
  buildMailtoUrl,
  buildWhatsAppChatUrl,
} from '../lib/contact';
import { triggerHaptic } from '../lib/haptics';

export const WhatsAppLogoIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M16 3C8.82 3 3 8.71 3 15.75C3 18.43 3.85 20.99 5.38 23.14L3.83 28.78L9.66 27.26C11.58 28.31 13.76 28.86 16 28.86C23.18 28.86 29 23.15 29 16.11C29 9.07 23.18 3 16 3Z"
      fill="#25D366"
    />
    <path
      d="M22.36 19.34C22.02 19.17 20.32 18.34 20 18.23C19.68 18.12 19.45 18.06 19.22 18.4C18.99 18.74 18.33 19.51 18.13 19.74C17.93 19.97 17.73 20 17.39 19.83C17.05 19.66 15.95 19.3 14.65 18.15C13.64 17.26 12.96 16.15 12.76 15.81C12.56 15.47 12.74 15.29 12.91 15.12C13.06 14.97 13.25 14.72 13.42 14.52C13.59 14.32 13.65 14.18 13.76 13.95C13.87 13.72 13.82 13.52 13.73 13.35C13.65 13.18 12.96 11.51 12.68 10.83C12.4 10.17 12.12 10.26 11.91 10.25L11.25 10.24C11.02 10.24 10.65 10.32 10.33 10.66C10.02 11 9.13 11.83 9.13 13.5C9.13 15.17 10.36 16.79 10.53 17.02C10.7 17.25 12.95 20.69 16.39 22.17C17.21 22.52 17.85 22.73 18.35 22.89C19.17 23.15 19.92 23.11 20.51 23.02C21.17 22.92 22.53 22.2 22.82 21.4C23.1 20.6 23.1 19.92 23.02 19.77C22.93 19.62 22.7 19.51 22.36 19.34Z"
      fill="#FFFFFF"
    />
  </svg>
);

interface DeveloperContactCardProps {
  compact?: boolean;
}

export const DeveloperContactCard: React.FC<DeveloperContactCardProps> = ({
  compact = false,
}) => {
  const whatsappHref = buildWhatsAppChatUrl();
  const mailtoHref = buildMailtoUrl();

  if (compact) {
    return (
      <footer
        aria-label="Owner and direct contact footer"
        className="mt-8 rounded-2xl bg-[#0B0B0F] border border-[#23232B] px-4 py-4 sm:px-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#160A0D] border border-[#EF4444]/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#9A9AA6]">
                {OWNER_CONTACT.creditLabel}
              </div>
              <div
                data-testid="footer-owner-credit"
                className="text-sm font-bold text-white truncate"
              >
                {OWNER_CONTACT.ownerCredit}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-whatsapp-link"
              onClick={() => triggerHaptic('action')}
              className="ios-spring-btn min-h-[44px] inline-flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2 rounded-xl bg-[#0D1F15] border border-[#25D366]/55 hover:border-[#25D366] text-white transition-colors"
            >
              <span className="inline-flex items-center gap-2.5 min-w-0">
                <WhatsAppLogoIcon className="w-5 h-5 shrink-0" />
                <span className="text-left min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#25D366]">
                    WhatsApp Direct Chat
                  </span>
                  <span className="block text-xs font-bold font-mono-num text-white">
                    {OWNER_CONTACT.phoneLocal}
                  </span>
                </span>
              </span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#25D366] shrink-0"
                aria-hidden="true"
              />
            </a>

            <a
              href={mailtoHref}
              data-testid="footer-email-link"
              onClick={() => triggerHaptic('selection')}
              className="ios-spring-btn min-h-[44px] inline-flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2 rounded-xl bg-[#060609] border border-[#2A2A34] hover:border-[#EF4444]/70 text-white transition-colors min-w-0"
            >
              <span className="inline-flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#160A0D] border border-[#EF4444]/40 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                </span>
                <span className="text-left min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#9A9AA6]">
                    Email Support
                  </span>
                  <span className="block text-xs font-medium text-white truncate">
                    {OWNER_CONTACT.email}
                  </span>
                </span>
              </span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#9A9AA6] shrink-0"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <section
      aria-labelledby="owner-contact-heading"
      className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-mono-num uppercase tracking-[0.16em] text-[#EF4444]">
            {OWNER_CONTACT.creditLabel}
          </span>
          <h2
            id="owner-contact-heading"
            data-testid="hub-owner-credit"
            className="text-base sm:text-lg font-bold text-white mt-0.5"
          >
            {OWNER_CONTACT.ownerCredit}
          </h2>
        </div>
        <span className="text-xs text-[#9A9AA6]">
          Tap WhatsApp or Email for instant chat &amp; custom configs
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="hub-whatsapp-link"
          onClick={() => triggerHaptic('action')}
          className="ios-spring-btn min-h-[60px] rounded-xl bg-[#091810] border border-[#25D366]/55 hover:border-[#25D366] px-4 py-3 flex items-center justify-between gap-3 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#10261A] border border-[#25D366]/45 flex items-center justify-center shrink-0">
              <WhatsAppLogoIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#25D366]">
                WhatsApp Chat
              </div>
              <div className="text-sm font-extrabold font-mono-num text-white">
                {OWNER_CONTACT.phoneLocal}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] text-[#050507] text-[11px] font-extrabold whitespace-nowrap shrink-0">
            Open Chat
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </a>

        <a
          href={mailtoHref}
          data-testid="hub-email-link"
          onClick={() => triggerHaptic('selection')}
          className="ios-spring-btn min-h-[60px] rounded-xl bg-[#060609] border border-[#2A2A34] hover:border-[#EF4444]/70 px-4 py-3 flex items-center justify-between gap-3 transition-colors min-w-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#160A0D] border border-[#EF4444]/40 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#EF4444]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
                Official Email
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white truncate">
                {OWNER_CONTACT.email}
              </div>
            </div>
          </div>
          <ArrowUpRight
            className="w-4 h-4 text-[#9A9AA6] shrink-0"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  );
};
