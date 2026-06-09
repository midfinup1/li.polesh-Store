"use client";

import { useSiteSettings } from "@/lib/site-settings";
import { policyDictionaries } from "@/lib/policy-dictionaries";

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className="mb-4 text-[18px] font-semibold leading-[120%] tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <p className="whitespace-pre-line text-[16px] font-medium leading-[150%] text-ink">{text}</p>
    </section>
  );
}

export function PrivacyContent() {
  const { language, t } = useSiteSettings();
  const p = policyDictionaries[language].privacy;

  return (
    <main className="mx-auto max-w-[960px] px-6 py-[124px] md:px-10">
      <p className="mb-6 text-[16px] font-medium uppercase leading-[150%] tracking-widest text-ink-light">
        {t.common.documents}
      </p>

      <h1 className="mb-12 text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px] md:leading-[1.1]">
        {p.title}
      </h1>

      <div className="space-y-10">
        <Section title={p.s1Title} text={p.s1Text} />
        <Section title={p.s2Title} text={p.s2Text} />
        <Section title={p.s3Title} text={p.s3Text} />
        <Section title={p.s4Title} text={p.s4Text} />
        <Section title={p.s5Title} text={p.s5Text} />
        <Section title={p.s6Title} text={p.s6Text} />
        <Section title={p.s7Title} text={p.s7Text} />
        <Section title={p.s8Title} text={p.s8Text} />
        <Section title={p.s9Title} text={p.s9Text} />
      </div>
    </main>
  );
}

export function PersonalDataContent() {
  const { language, t } = useSiteSettings();
  const p = policyDictionaries[language].personalData;

  return (
    <main className="mx-auto max-w-[960px] px-6 py-[124px] md:px-10">
      <p className="mb-6 text-[16px] font-medium uppercase leading-[150%] tracking-widest text-ink-light">
        {t.common.documents}
      </p>

      <h1 className="mb-12 text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px] md:leading-[1.1]">
        {p.title}
      </h1>

      <div className="space-y-10">
        <Section title={p.s1Title} text={p.s1Text} />
        <Section title={p.s2Title} text={p.s2Text} />
        <Section title={p.s3Title} text={p.s3Text} />
        <Section title={p.s4Title} text={p.s4Text} />
        <Section title={p.s5Title} text={p.s5Text} />
        <Section title={p.s6Title} text={p.s6Text} />
        <Section title={p.s7Title} text={p.s7Text} />
        <Section title={p.s8Title} text={p.s8Text} />
      </div>
    </main>
  );
}
