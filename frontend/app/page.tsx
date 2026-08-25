'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useT } from '@/lib/i18n';
import styles from './page.module.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const { locale, token } = useApp();
  const router = useRouter();
  const t = useT(locale);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (token && params.get('from') !== 'dashboard') {
      router.push('/dashboard');
    }
  }, [token, router]);

  useGSAP(() => {

    const tlHero = gsap.timeline({ defaults: { ease: 'power3.out' } });

    gsap.set(`.${styles.heroBadge}`, { opacity: 0, y: -20 });
    gsap.set(`.${styles.heroTitle}`, { opacity: 0, y: 30 });
    gsap.set(`.${styles.heroSubtitle}`, { opacity: 0, y: 20 });
    gsap.set(`.${styles.heroCtas} > *`, { opacity: 0, y: 15 });
    gsap.set(`.${styles.heroTrust}`, { opacity: 0, y: 15 });
    gsap.set(`.${styles.heroVisual}`, { opacity: 0, scale: 0.95, y: 40 });
    gsap.set(`.${styles.heroFloat1}`, { opacity: 0, scale: 0.8 });
    gsap.set(`.${styles.heroFloat2}`, { opacity: 0, scale: 0.8 });

    tlHero
      .to(`.${styles.heroBadge}`, { opacity: 1, y: 0, duration: 0.6 })
      .to(`.${styles.heroTitle}`, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .to(`.${styles.heroSubtitle}`, { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
      .to(`.${styles.heroCtas} > *`, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, '-=0.4')
      .to(`.${styles.heroTrust}`, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      .to(`.${styles.heroVisual}`, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.6')
      .to([`.${styles.heroFloat1}`, `.${styles.heroFloat2}`], { opacity: 1, scale: 1, duration: 0.5, stagger: 0.15, ease: 'back.out(1.5)' }, '-=0.3');

    gsap.to(`.${styles.heroVisual}`, {
      y: -10,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    const stats = gsap.utils.toArray<HTMLElement>(`.${styles.statItem}`);
    stats.forEach((stat) => {
      const numberElement = stat.querySelector(`.${styles.statNumber}`);
      if (!numberElement) return;
      const text = numberElement.textContent || '';

      const numericVal = parseFloat(text.replace(/[^0-9.]/g, ''));
      const isMillion = text.includes('M');
      const isPercent = text.includes('%');
      const isPlus = text.includes('+');

      const countObj = { value: 0 };

      gsap.to(countObj, {
        value: numericVal,
        scrollTrigger: {
          trigger: stat,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          let valStr = '';
          if (isPercent) {
            valStr = countObj.value.toFixed(1);
          } else {
            valStr = Math.floor(countObj.value).toLocaleString('en-US');
          }
          if (isMillion) valStr += 'M';
          if (isPercent) valStr += '%';
          if (isPlus) valStr += '+';
          numberElement.textContent = valStr;
        }
      });
    });

    gsap.set(`.${styles.featureCard}`, { opacity: 0, y: 40 });
    gsap.to(`.${styles.featureCard}`, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: `.${styles.featuresGrid}`,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });

    const steps = gsap.utils.toArray<HTMLElement>(`.${styles.step}`);
    const connectors = gsap.utils.toArray<HTMLElement>(`.${styles.stepConnector}`);

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
    gsap.set(steps, { opacity: 0, scale: 0.9, y: 30 });
    gsap.set(connectors, { 
      opacity: 0, 
      scaleX: 0, 
      transformOrigin: isMobile ? 'center center' : (locale === 'ar' ? 'right center' : 'left center') 
    });

    const tlSteps = gsap.timeline({
      scrollTrigger: {
        trigger: `.${styles.stepsGrid}`,
        start: 'top 75%',
        toggleActions: 'play none none none'
      }
    });

    steps.forEach((step, index) => {
      tlSteps.to(step, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.2)' });
      if (index < connectors.length) {
        tlSteps.to(connectors[index], { opacity: 1, scaleX: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2');
      }
    });

    const pricingCards = gsap.utils.toArray<HTMLElement>(`.${styles.pricingCard}`);
    gsap.set(pricingCards, { opacity: 0, y: 50, scale: 0.95 });
    gsap.to(pricingCards, {
      opacity: 1,
      y: 0,
      scale: (i, target) => target.classList.contains(styles.pricingCardPopular) ? 1.02 : 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'back.out(1.1)',
      scrollTrigger: {
        trigger: `.${styles.pricingGrid}`,
        start: 'top 75%',
        toggleActions: 'play none none none'
      }
    });

    const ctaCard = document.querySelector(`.${styles.ctaCard}`);
    if (ctaCard) {
      gsap.set(ctaCard, { opacity: 0, scale: 0.95 });
      gsap.to(ctaCard, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ctaCard,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
      const ctaGlow = ctaCard.querySelector(`.${styles.ctaGlow}`);
      if (ctaGlow) {
        gsap.to(ctaGlow, {
          scale: 1.2,
          opacity: 0.15,
          duration: 4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
      }
    }
  }, { scope: containerRef });

  const features = [
    { key: 'officialApi', icon: <MetaIcon />, color: '#25D366' },
    { key: 'embeddedSignup', icon: <LinkIcon />, color: '#E8833A' },
    { key: 'customApi', icon: <ApiIcon />, color: '#8B6F47' },
    { key: 'templates', icon: <TemplateIcon />, color: '#3B82F6' },
    { key: 'webhooks', icon: <WebhookIcon />, color: '#F59E0B' },
    { key: 'analytics', icon: <ChartIcon />, color: '#22C55E' },
    { key: 'security', icon: <ShieldIcon />, color: '#EF4444' },
    { key: 'multiLang', icon: <GlobeIcon />, color: '#8B5CF6' },
  ];

  return (
    <main className={styles.main} ref={containerRef}>
      {}
      <section className={styles.hero} id="hero">
        <div className={styles.heroBg}>
          <div className={styles.heroGlow1} />
          <div className={styles.heroGlow2} />
          <div className={styles.heroGrid} />
        </div>
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              <span>WhatsApp Cloud API – Official Meta Partner</span>
            </div>
            <h1 className={styles.heroTitle}>
              {t('hero.title')}{' '}
              <span className={styles.heroHighlight}>{t('hero.titleHighlight')}</span>
            </h1>
            <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
            <div className={styles.heroCtas}>
              <Link href="/auth/register" className={`btn btn-primary btn-lg ${styles.heroCta}`}>
                {t('hero.cta')}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <a href="#how-it-works" className={`btn btn-outline btn-lg ${styles.heroCtaSecondary}`}>
                {t('hero.ctaSecondary')}
              </a>
            </div>
            <div className={styles.heroTrust}>
              <div className={styles.trustAvatars}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={styles.trustAvatar} style={{ background: `hsl(${i * 50 + 20}, 50%, 60%)` }}>
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className={styles.trustText}>
                <span className={styles.trustCount}>2,500+</span>
                <span className={styles.trustLabel}>{t('hero.trustedBy')} {t('hero.companies')}</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <div className={styles.heroCardDot} style={{ background: '#EF4444' }} />
                <div className={styles.heroCardDot} style={{ background: '#F59E0B' }} />
                <div className={styles.heroCardDot} style={{ background: '#22C55E' }} />
                <span className={styles.heroCardTitle}>api.trustchat.com</span>
              </div>
              <div className={styles.heroCardBody}>
                <pre className={styles.heroCode}>
                  <code>
                    <span className={styles.codeComment}>// Request</span>{'\n'}
                    <span className={styles.codeKeyword}>POST</span> /api/v1/send-message{'\n\n'}
                    {'{'}{'\n'}
                    {'  '}<span className={styles.codeKey}>&quot;to&quot;</span>: <span className={styles.codeString}>&quot;+966XXXXXXXXX&quot;</span>,{'\n'}
                    {'  '}<span className={styles.codeKey}>&quot;type&quot;</span>: <span className={styles.codeString}>&quot;text&quot;</span>,{'\n'}
                    {'  '}<span className={styles.codeKey}>&quot;body&quot;</span>: <span className={styles.codeString}>&quot;مرحباً من TrustChat!&quot;</span>{'\n'}
                    {'}'}{'\n\n'}
                    <span className={styles.codeComment}>// Response</span>{'\n'}
                    {'{'}{'\n'}
                    {'  '}<span className={styles.codeKey}>&quot;status&quot;</span>: <span className={styles.codeString}>&quot;sent&quot;</span>,{'\n'}
                    {'  '}<span className={styles.codeKey}>&quot;message_id&quot;</span>: <span className={styles.codeString}>&quot;wamid.xxx&quot;</span>{'\n'}
                    {'}'}
                  </code>
                </pre>
              </div>
            </div>
            <div className={styles.heroFloat1}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.636-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.174-.693-5.812-1.87l-.416-.296-3.003.95.993-2.921-.324-.458A9.776 9.776 0 012.182 12c0-5.423 4.395-9.818 9.818-9.818S21.818 6.577 21.818 12s-4.395 9.818-9.818 9.818z"/></svg>
              <span>Message Sent ✓</span>
            </div>
            <div className={styles.heroFloat2}>
              <span className={styles.heroFloat2Label}>99.9%</span>
              <span className={styles.heroFloat2Sub}>{t('hero.uptime')}</span>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>50M+</span>
              <span className={styles.statLabel}>{t('stats.messages')}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>2,500+</span>
              <span className={styles.statLabel}>{t('stats.clients')}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>99.9%</span>
              <span className={styles.statLabel}>{t('stats.uptime')}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>40+</span>
              <span className={styles.statLabel}>{t('stats.countries')}</span>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className={styles.features} id="features">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('features.title')}</h2>
            <p className={styles.sectionSubtitle}>{t('features.subtitle')}</p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature) => (
              <div key={feature.key} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: `${feature.color}15`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{t(`features.${feature.key}.title`)}</h3>
                <p className={styles.featureDesc}>{t(`features.${feature.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className={styles.howItWorks} id="how-it-works">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('howItWorks.title')}</h2>
            <p className={styles.sectionSubtitle}>{t('howItWorks.subtitle')}</p>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className={styles.stepTitle}>{t('howItWorks.step1.title')}</h3>
              <p className={styles.stepDesc}>{t('howItWorks.step1.desc')}</p>
            </div>
            <div className={styles.stepConnector}>
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M0 12H44M44 12L36 4M44 12L36 20" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <h3 className={styles.stepTitle}>{t('howItWorks.step2.title')}</h3>
              <p className={styles.stepDesc}>{t('howItWorks.step2.desc')}</p>
            </div>
            <div className={styles.stepConnector}>
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M0 12H44M44 12L36 4M44 12L36 20" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <h3 className={styles.stepTitle}>{t('howItWorks.step3.title')}</h3>
              <p className={styles.stepDesc}>{t('howItWorks.step3.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className={styles.pricing} id="pricing">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('pricing.title')}</h2>
            <p className={styles.sectionSubtitle}>{t('pricing.subtitle')}</p>
          </div>

          {}
          <div className={styles.billingToggle}>
            <button 
              className={`${styles.billingBtn} ${billingCycle === 'monthly' ? styles.billingBtnActive : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              {t('pricing.monthly')}
            </button>
            <button 
              className={`${styles.billingBtn} ${billingCycle === 'yearly' ? styles.billingBtnActive : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              {t('pricing.yearly')}
              <span className={styles.saveBadge}>{t('pricing.save')} 20%</span>
            </button>
          </div>

          <div className={styles.pricingGrid}>
            {}
            <div className={styles.pricingCard}>
              <div className={styles.pricingCardHeader}>
                <h3 className={styles.planName}>{t('pricing.starter.name')}</h3>
                <p className={styles.planDesc}>{t('pricing.starter.desc')}</p>
              </div>
              <div className={styles.priceBlock}>
                <span className={styles.priceAmount}>
                  {billingCycle === 'monthly' ? t('pricing.starter.price') : t('pricing.starter.yearlyPrice')}
                </span>
                <span className={styles.priceCurrency}>{t('pricing.currency')}</span>
                <span className={styles.pricePeriod}>
                  {billingCycle === 'monthly' ? t('pricing.month') : t('pricing.year')}
                </span>
              </div>
              <Link href="/auth/register" className={`btn btn-outline ${styles.planBtn}`}>
                {t('pricing.startTrial')}
              </Link>
              <ul className={styles.planFeatures}>
                {(t('pricing.starter.features') as unknown as string[]).map ? 
                  ['1,000 msg/mo', '1 number', 'Basic templates', 'Email support', '1 API Key', 'Basic reports'].map((f, i) => (
                    <li key={i} className={styles.planFeature}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{locale === 'ar' ? ['1,000 رسالة شهرياً', 'رقم واحد', 'قوالب أساسية', 'دعم بالبريد', 'API Key واحد', 'تقارير أساسية'][i] : f}</span>
                    </li>
                  )) : null
                }
              </ul>
            </div>

            {}
            <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
              <div className={styles.popularBadge}>{t('pricing.popular')}</div>
              <div className={styles.pricingCardHeader}>
                <h3 className={styles.planName}>{t('pricing.professional.name')}</h3>
                <p className={styles.planDesc}>{t('pricing.professional.desc')}</p>
              </div>
              <div className={styles.priceBlock}>
                <span className={styles.priceAmount}>
                  {billingCycle === 'monthly' ? t('pricing.professional.price') : t('pricing.professional.yearlyPrice')}
                </span>
                <span className={styles.priceCurrency}>{t('pricing.currency')}</span>
                <span className={styles.pricePeriod}>
                  {billingCycle === 'monthly' ? t('pricing.month') : t('pricing.year')}
                </span>
              </div>
              <Link href="/auth/register" className={`btn btn-primary ${styles.planBtn}`}>
                {t('pricing.startTrial')}
              </Link>
              <ul className={styles.planFeatures}>
                {['10,000 msg/mo', '5 numbers', 'Unlimited templates', 'Priority support', '5 API Keys', 'Advanced reports', 'Webhooks', 'Data export'].map((f, i) => (
                  <li key={i} className={styles.planFeature}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{locale === 'ar' ? ['10,000 رسالة شهرياً', '5 أرقام', 'قوالب غير محدودة', 'دعم أولوية', '5 API Keys', 'تقارير متقدمة', 'Webhooks', 'تصدير البيانات'][i] : f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {}
            <div className={styles.pricingCard}>
              <div className={styles.pricingCardHeader}>
                <h3 className={styles.planName}>{t('pricing.enterprise.name')}</h3>
                <p className={styles.planDesc}>{t('pricing.enterprise.desc')}</p>
              </div>
              <div className={styles.priceBlock}>
                <span className={styles.priceAmount}>
                  {billingCycle === 'monthly' ? t('pricing.enterprise.price') : t('pricing.enterprise.yearlyPrice')}
                </span>
                <span className={styles.priceCurrency}>{t('pricing.currency')}</span>
                <span className={styles.pricePeriod}>
                  {billingCycle === 'monthly' ? t('pricing.month') : t('pricing.year')}
                </span>
              </div>
              <Link href="/auth/register" className={`btn btn-secondary ${styles.planBtn}`}>
                {t('pricing.contactSales')}
              </Link>
              <ul className={styles.planFeatures}>
                {['Unlimited messages', 'Unlimited numbers', 'Unlimited templates', '24/7 support', 'Unlimited API Keys', 'Advanced reports', 'Webhooks', 'Account manager', 'Custom SLA'].map((f, i) => (
                  <li key={i} className={styles.planFeature}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{locale === 'ar' ? ['رسائل غير محدودة', 'أرقام غير محدودة', 'قوالب غير محدودة', 'دعم 24/7', 'API Keys غير محدودة', 'تقارير متقدمة', 'Webhooks', 'مدير حساب مخصص', 'SLA مخصص'][i] : f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaBg}>
              <div className={styles.ctaGlow} />
            </div>
            <h2 className={styles.ctaTitle}>{t('cta.title')}</h2>
            <p className={styles.ctaSubtitle}>{t('cta.subtitle')}</p>
            <Link href="/auth/register" className={`btn btn-lg ${styles.ctaBtn}`}>
              {t('cta.button')}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetaIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

function ApiIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  );
}

function WebhookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.68-2.95 1.39C8.07 19.26 7.51 20 6 20c-1.66 0-3-1.34-3-3s1.34-3 3-3c.71 0 1.37.29 1.83.74"/>
      <path d="M8 14a3 3 0 0 1 0-6"/>
      <path d="M12 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3"/>
      <path d="M2 12h4"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}