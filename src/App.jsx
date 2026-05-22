import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ContentTypeTabs from './components/ContentTypeTabs';
import StylingPanel from './components/StylingPanel';
import LivePreview from './components/LivePreview';
import ScannerModal from './components/ScannerModal';
import MobileFABs from './components/MobileFABs';

// Inputs
import UrlInput from './components/inputs/UrlInput';
import TextInput from './components/inputs/TextInput';
import WifiInput from './components/inputs/WifiInput';
import EmailInput from './components/inputs/EmailInput';
import SmsInput from './components/inputs/SmsInput';
import VcardInput from './components/inputs/VcardInput';

// Utils
import { TRANSLATIONS } from './utils/translations';
import { getQRDataString, PRESET_LOGOS } from './utils/qrHelper';

export default function App() {
  // 1. Language State Setup
  const [lang, setLang] = useState(() => {
    const storedLang = localStorage.getItem('qrgo_lang');
    if (storedLang && ['en', 'pt', 'es'].includes(storedLang)) {
      return storedLang;
    }
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const parsedLang = browserLang.substring(0, 2).toLowerCase();
    if (['en', 'pt', 'es'].includes(parsedLang)) {
      return parsedLang;
    }
    return 'en';
  });

  // Sync lang changes to LocalStorage & SEO properties
  useEffect(() => {
    localStorage.setItem('qrgo_lang', lang);
    const pageTitle = TRANSLATIONS[lang]['seoTitle'] || 'QRGo | Premium Custom QR Code Generator';
    const pageDesc = TRANSLATIONS[lang]['seoDesc'] || '';

    document.title = pageTitle;
    document.documentElement.lang = lang;

    const seoDescEl = document.getElementById('seo-description');
    if (seoDescEl) seoDescEl.setAttribute('content', pageDesc);

    const ogTitleEl = document.getElementById('og-title');
    if (ogTitleEl) ogTitleEl.setAttribute('content', pageTitle);

    const ogDescEl = document.getElementById('og-description');
    if (ogDescEl) ogDescEl.setAttribute('content', pageDesc);
  }, [lang]);

  // 2. Active Content Type Tab State
  const [activeTab, setActiveTab] = useState('url');

  // 3. Form Input Values State
  const [formValues, setFormValues] = useState({
    url: '',
    text: '',
    wifiSsid: '',
    wifiPass: '',
    wifiType: 'WPA',
    wifiHidden: false,
    emailTo: '',
    emailSub: '',
    emailBody: '',
    smsPhone: '',
    smsBody: '',
    vcardFirst: '',
    vcardLast: '',
    vcardCompany: '',
    vcardTitle: '',
    vcardPhone: '',
    vcardEmail: '',
    vcardUrl: ''
  });

  const handleFormChange = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // 4. Styling Config State
  const [styleConfig, setStyleConfig] = useState({
    dotsType: 'rounded',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'rounded',
    ecLevel: 'H',
    margin: 15,
    fgType: 'single', // 'single' (solid) or 'gradient'
    dotsColor: '#8b5cf6',
    dotsColorSecondary: '#06b6d4',
    gradientType: 'linear', // 'linear' or 'radial'
    gradientRotation: 45,
    customCorners: false,
    cornersSquareColor: '#7c3aed',
    cornersDotColor: '#0891b2',
    bgColor: '#ffffff',
    bgTransparent: false,
    logoPreset: 'none',
    logoFile: '',
    logoFilename: '',
    logoScale: 0.2,
    logoMargin: true
  });

  // Smart suggestions when active content tab changes
  useEffect(() => {
    if (activeTab === 'wifi') {
      if (styleConfig.logoPreset === 'none') {
        setStyleConfig((prev) => ({
          ...prev,
          logoPreset: 'wifi',
          logoFile: PRESET_LOGOS.wifi,
          logoFilename: 'wifi-logo',
          ecLevel: 'H'
        }));
      }
    } else if (activeTab === 'email') {
      if (styleConfig.logoPreset === 'wifi') {
        setStyleConfig((prev) => ({
          ...prev,
          logoPreset: 'email',
          logoFile: PRESET_LOGOS.email,
          logoFilename: 'email-logo',
          ecLevel: 'H'
        }));
      }
    } else if (activeTab === 'url') {
      if (styleConfig.logoPreset === 'wifi' || styleConfig.logoPreset === 'email') {
        setStyleConfig((prev) => ({
          ...prev,
          logoPreset: 'web',
          logoFile: PRESET_LOGOS.web,
          logoFilename: 'web-logo',
          ecLevel: 'H'
        }));
      }
    }
  }, [activeTab]);

  // 5. Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Success handler for scanning QR codes
  const handleScanSuccess = (decodedText) => {
    const isUrl = /^https?:\/\//i.test(decodedText) || /^www\./i.test(decodedText);
    if (isUrl) {
      setActiveTab('url');
      const cleanUrl = decodedText.replace(/^https?:\/\//i, '');
      handleFormChange('url', cleanUrl);
    } else {
      setActiveTab('text');
      handleFormChange('text', decodedText);
    }
  };

  // Copy content to clipboard
  const handleCopyContent = () => {
    const dataString = getQRDataString(activeTab, formValues, TRANSLATIONS, lang);
    navigator.clipboard.writeText(dataString)
      .then(() => {
        alert(TRANSLATIONS[lang]['alertCopySuccess'] || 'Copied successfully!');
      })
      .catch((err) => {
        alert((TRANSLATIONS[lang]['alertCopyFail'] || 'Failed to copy text: ') + err);
      });
  };

  // Export styling JSON config
  const handleExportStyle = () => {
    const config = {
      dotStyle: styleConfig.dotsType,
      ecLevel: styleConfig.ecLevel,
      cornerOuter: styleConfig.cornersSquareType,
      cornerInner: styleConfig.cornersDotType,
      margin: styleConfig.margin,
      fgType: styleConfig.fgType,
      primaryColor: styleConfig.dotsColor,
      secondaryColor: styleConfig.dotsColorSecondary,
      gradientType: styleConfig.gradientType,
      gradientRotation: styleConfig.gradientRotation,
      hasCustomCorners: styleConfig.customCorners,
      cornerOuterColor: styleConfig.cornersSquareColor,
      cornerInnerColor: styleConfig.cornersDotColor,
      isTransparent: styleConfig.bgTransparent,
      bgColor: styleConfig.bgColor,
      activePreset: styleConfig.logoPreset,
      logoScale: Math.round(styleConfig.logoScale * 100),
      hasLogoBg: styleConfig.logoMargin,
      uploadedLogoDataUrl: styleConfig.logoPreset === 'custom' ? styleConfig.logoFile : null,
      uploadedLogoName: styleConfig.logoPreset === 'custom' ? styleConfig.logoFilename : ''
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "qrgo_style_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import styling JSON config
  const handleImportStyle = (config) => {
    setStyleConfig({
      dotsType: config.dotStyle || 'rounded',
      ecLevel: config.ecLevel || 'H',
      cornersSquareType: config.cornerOuter || 'extra-rounded',
      cornersDotType: config.cornerInner || 'rounded',
      margin: config.margin !== undefined ? config.margin : 15,
      fgType: config.fgType === 'solid' ? 'single' : (config.fgType || 'single'),
      dotsColor: config.primaryColor || '#8b5cf6',
      dotsColorSecondary: config.secondaryColor || '#06b6d4',
      gradientType: config.gradientType || 'linear',
      gradientRotation: config.gradientRotation !== undefined ? config.gradientRotation : 45,
      customCorners: !!config.hasCustomCorners,
      cornersSquareColor: config.cornerOuterColor || '#7c3aed',
      cornersDotColor: config.cornerInnerColor || '#0891b2',
      bgTransparent: !!config.isTransparent,
      bgColor: config.bgColor || '#ffffff',
      logoPreset: config.activePreset || 'none',
      logoScale: config.logoScale !== undefined ? config.logoScale / 100 : 0.2,
      logoMargin: config.hasLogoBg !== undefined ? config.hasLogoBg : true,
      logoFile: config.activePreset === 'custom' ? config.uploadedLogoDataUrl : (config.activePreset && config.activePreset !== 'none' ? PRESET_LOGOS[config.activePreset] : ''),
      logoFilename: config.activePreset === 'custom' ? config.uploadedLogoName : (config.activePreset !== 'none' ? `${config.activePreset}-logo` : '')
    });
  };

  // Get active form component
  const renderInputForm = () => {
    switch (activeTab) {
      case 'url':
        return <UrlInput value={formValues.url} onChange={(val) => handleFormChange('url', val)} lang={lang} translations={TRANSLATIONS} />;
      case 'text':
        return <TextInput value={formValues.text} onChange={(val) => handleFormChange('text', val)} lang={lang} translations={TRANSLATIONS} />;
      case 'wifi':
        return (
          <WifiInput
            ssid={formValues.wifiSsid}
            pass={formValues.wifiPass}
            type={formValues.wifiType}
            hidden={formValues.wifiHidden}
            onChange={(key, val) => handleFormChange(key, val)}
            lang={lang}
            translations={TRANSLATIONS}
          />
        );
      case 'email':
        return (
          <EmailInput
            to={formValues.emailTo}
            sub={formValues.emailSub}
            body={formValues.emailBody}
            onChange={(key, val) => handleFormChange(key, val)}
            lang={lang}
            translations={TRANSLATIONS}
          />
        );
      case 'sms':
        return (
          <SmsInput
            phone={formValues.smsPhone}
            body={formValues.smsBody}
            onChange={(key, val) => handleFormChange(key, val)}
            lang={lang}
            translations={TRANSLATIONS}
          />
        );
      case 'vcard':
        return (
          <VcardInput
            first={formValues.vcardFirst}
            last={formValues.vcardLast}
            company={formValues.vcardCompany}
            title={formValues.vcardTitle}
            phone={formValues.vcardPhone}
            email={formValues.vcardEmail}
            url={formValues.vcardUrl}
            onChange={(key, val) => handleFormChange(key, val)}
            lang={lang}
            translations={TRANSLATIONS}
          />
        );
      default:
        return null;
    }
  };

  const qrData = getQRDataString(activeTab, formValues, TRANSLATIONS, lang);

  return (
    <div className="app-layout">
      {/* Dynamic Background floating blobs */}
      <div className="bg-blobs select-none" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="app-container">
        {/* Header with language selector */}
        <Header lang={lang} setLang={setLang} translations={TRANSLATIONS} />

        {/* Two column grid layout */}
        <main className="app-workspace">
          <section className="designer-panel">
            <div className="designer-card card">
              {/* Step 1: Content Type tabs */}
              <div className="section-title select-none">
                <span className="step-number">1</span>
                <h2>{TRANSLATIONS[lang]['step1Title']}</h2>
              </div>

              <ContentTypeTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                lang={lang}
                translations={TRANSLATIONS}
              />

              {/* Dynamic input form pane */}
              <div className="tab-contents">
                <div className="tab-pane active">
                  {renderInputForm()}
                </div>
              </div>

              <hr className="panel-divider select-none" />

              {/* Step 2: Styling panel */}
              <StylingPanel
                styleConfig={styleConfig}
                setStyleConfig={setStyleConfig}
                lang={lang}
                translations={TRANSLATIONS}
                onExport={handleExportStyle}
                onImport={handleImportStyle}
              />
            </div>
          </section>

          {/* Right Column: Canvas Live Preview & Export */}
          <LivePreview
            qrData={qrData}
            styleConfig={styleConfig}
            lang={lang}
            translations={TRANSLATIONS}
            onScanClick={() => setIsScannerOpen(true)}
            onCopyClick={handleCopyContent}
          />
        </main>

        {/* Footer */}
        <Footer lang={lang} translations={TRANSLATIONS} />
      </div>

      {/* Camera QR Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        lang={lang}
        translations={TRANSLATIONS}
      />

      {/* Mobile Floating Action Buttons */}
      <MobileFABs
        onScanClick={() => setIsScannerOpen(true)}
        lang={lang}
        translations={TRANSLATIONS}
      />
    </div>
  );
}
