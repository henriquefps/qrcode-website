import React, { lazy, Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Header from './components/Header';
import Footer from './components/Footer';
import ContentTypeTabs from './components/ContentTypeTabs';
import StylingPanel from './components/StylingPanel';
import LivePreview from './components/LivePreview';
import MobileFABs from './components/MobileFABs';

// html5-qrcode is heavy — only load the scanner when the user opens it
const ScannerModal = lazy(() => import('./components/ScannerModal'));

import UrlInput from './components/inputs/UrlInput';
import TextInput from './components/inputs/TextInput';
import WifiInput from './components/inputs/WifiInput';
import EmailInput from './components/inputs/EmailInput';
import SmsInput from './components/inputs/SmsInput';
import VcardInput from './components/inputs/VcardInput';

import { useTheme } from './hooks/useTheme';
import { getQRDataString, PRESET_LOGOS } from './utils/qrHelper';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('url');

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
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const [styleConfig, setStyleConfig] = useState({
    dotsType: 'rounded',
    cornersSquareType: 'extra-rounded',
    cornersDotType: 'rounded',
    ecLevel: 'H',
    margin: 15,
    fgType: 'single', // 'single' (solid) or 'gradient'
    dotsColor: '#172e37',
    dotsColorSecondary: '#505f76',
    gradientType: 'linear', // 'linear' or 'radial'
    gradientRotation: 45,
    customCorners: false,
    cornersSquareColor: '#172e37',
    cornersDotColor: '#505f76',
    bgColor: '#ffffff',
    bgTransparent: false,
    logoPreset: 'none',
    logoFile: '',
    logoFilename: '',
    logoScale: 0.2,
    logoMargin: true
  });

  // Suggest a matching preset logo when the content type changes
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

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = (decodedText) => {
    const isUrl = /^https?:\/\//i.test(decodedText) || /^www\./i.test(decodedText);
    if (isUrl) {
      setActiveTab('url');
      handleFormChange('url', decodedText.replace(/^https?:\/\//i, ''));
    } else {
      setActiveTab('text');
      handleFormChange('text', decodedText);
    }
  };

  const handleCopyContent = () => {
    const dataString = getQRDataString(activeTab, formValues);
    navigator.clipboard
      .writeText(dataString)
      .then(() => toast.success('Content copied to clipboard.'))
      .catch((err) => toast.error(`Failed to copy text: ${err}`));
  };

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

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'qrgo_style_config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportStyle = (config) => {
    setStyleConfig({
      dotsType: config.dotStyle || 'rounded',
      ecLevel: config.ecLevel || 'H',
      cornersSquareType: config.cornerOuter || 'extra-rounded',
      cornersDotType: config.cornerInner || 'rounded',
      margin: config.margin !== undefined ? config.margin : 15,
      fgType: config.fgType === 'solid' ? 'single' : config.fgType || 'single',
      dotsColor: config.primaryColor || '#172e37',
      dotsColorSecondary: config.secondaryColor || '#505f76',
      gradientType: config.gradientType || 'linear',
      gradientRotation: config.gradientRotation !== undefined ? config.gradientRotation : 45,
      customCorners: !!config.hasCustomCorners,
      cornersSquareColor: config.cornerOuterColor || '#172e37',
      cornersDotColor: config.cornerInnerColor || '#505f76',
      bgTransparent: !!config.isTransparent,
      bgColor: config.bgColor || '#ffffff',
      logoPreset: config.activePreset || 'none',
      logoScale: config.logoScale !== undefined ? config.logoScale / 100 : 0.2,
      logoMargin: config.hasLogoBg !== undefined ? config.hasLogoBg : true,
      logoFile:
        config.activePreset === 'custom'
          ? config.uploadedLogoDataUrl
          : config.activePreset && config.activePreset !== 'none'
            ? PRESET_LOGOS[config.activePreset]
            : '',
      logoFilename:
        config.activePreset === 'custom'
          ? config.uploadedLogoName
          : config.activePreset !== 'none'
            ? `${config.activePreset}-logo`
            : ''
    });
  };

  const renderInputForm = () => {
    switch (activeTab) {
      case 'url':
        return <UrlInput value={formValues.url} onChange={(val) => handleFormChange('url', val)} />;
      case 'text':
        return <TextInput value={formValues.text} onChange={(val) => handleFormChange('text', val)} />;
      case 'wifi':
        return (
          <WifiInput
            ssid={formValues.wifiSsid}
            pass={formValues.wifiPass}
            type={formValues.wifiType}
            hidden={formValues.wifiHidden}
            onChange={handleFormChange}
          />
        );
      case 'email':
        return (
          <EmailInput
            to={formValues.emailTo}
            sub={formValues.emailSub}
            body={formValues.emailBody}
            onChange={handleFormChange}
          />
        );
      case 'sms':
        return (
          <SmsInput
            phone={formValues.smsPhone}
            body={formValues.smsBody}
            onChange={handleFormChange}
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
            onChange={handleFormChange}
          />
        );
      default:
        return null;
    }
  };

  const qrData = getQRDataString(activeTab, formValues);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-4 py-8 md:py-12">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card className="order-2 lg:order-1">
          <CardContent className="flex flex-col gap-6">
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  01 — Content
                </span>
                <span className="h-px max-w-[48px] flex-1 bg-border" />
              </div>

              <ContentTypeTabs activeTab={activeTab} setActiveTab={setActiveTab} />

              {renderInputForm()}
            </section>

            <Separator />

            <StylingPanel
              styleConfig={styleConfig}
              setStyleConfig={setStyleConfig}
              onExport={handleExportStyle}
              onImport={handleImportStyle}
            />
          </CardContent>
        </Card>

        <div className="order-1 lg:order-2">
          <LivePreview
            qrData={qrData}
            styleConfig={styleConfig}
            onScanClick={() => setIsScannerOpen(true)}
            onCopyClick={handleCopyContent}
          />
        </div>
      </main>

      <Footer />

      {isScannerOpen && (
        <Suspense fallback={null}>
          <ScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanSuccess={handleScanSuccess}
          />
        </Suspense>
      )}

      <MobileFABs onScanClick={() => setIsScannerOpen(true)} />

      <Toaster position="bottom-center" theme={theme} />
    </div>
  );
}
