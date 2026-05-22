import React, { useRef, useState } from 'react';
import { PRESET_LOGOS } from '../utils/qrHelper';

export default function StylingPanel({
  styleConfig,
  setStyleConfig,
  lang,
  translations,
  onExport,
  onImport
}) {
  const t = translations[lang];
  const fileInputRef = useRef(null);
  const importStyleRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Helper to handle simple changes
  const handleChange = (key, value) => {
    setStyleConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Sync color text inputs with color pickers
  const handleColorTextChange = (key, val) => {
    // Basic hex regex validation
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      handleChange(key, val);
    }
  };

  // Preset logo selection
  const handlePresetSelect = (preset) => {
    setStyleConfig((prev) => {
      const updated = { ...prev, logoPreset: preset };
      if (preset === 'none') {
        updated.logoFile = '';
        updated.logoFilename = '';
      } else {
        updated.logoFile = PRESET_LOGOS[preset];
        updated.logoFilename = `${preset}-logo`;
        // Auto upgrade EC Level to H for logos
        updated.ecLevel = 'H';
      }
      return updated;
    });
  };

  // File drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    // Validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert(t.alertInvalidImage);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(t.alertFileTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setStyleConfig((prev) => ({
        ...prev,
        logoPreset: 'custom',
        logoFile: e.target.result,
        logoFilename: file.name,
        ecLevel: 'H' // Auto upgrade EC Level to H for logos
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const clearLogo = () => {
    setStyleConfig((prev) => ({
      ...prev,
      logoPreset: 'none',
      logoFile: '',
      logoFilename: ''
    }));
  };

  // Handle configuration file import
  const handleImportFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          onImport(imported);
          // alert(t.alertImportSuccess);
        } catch (err) {
          alert(t.alertInvalidFile);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="section-container">
      <div className="section-title select-none">
        <span className="step-number">2</span>
        <h2>{t.stylingHeader}</h2>
      </div>

      <div className="style-actions-row select-none">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onExport}
          title="Save current colors and shapes for future use"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>{t.btnExportStyle}</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => importStyleRef.current?.click()}
          title="Load styled colors and shapes from file"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>{t.btnImportStyle}</span>
        </button>

        <input
          type="file"
          ref={importStyleRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>

      <div className="accordion">
        {/* Accordion Section: Shapes & Dots */}
        <details className="accordion-item" open>
          <summary className="accordion-header">
            <h3>{t.qrShapesHeader}</h3>
            <svg className="accordion-chevron" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div className="accordion-body">
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="select-dot-style">{t.dotPatternLabel}</label>
                <select
                  id="select-dot-style"
                  value={styleConfig.dotsType}
                  onChange={(e) => handleChange('dotsType', e.target.value)}
                >
                  <option value="rounded">{t.dotStyleRounded}</option>
                  <option value="dots">{t.dotStyleDots}</option>
                  <option value="classy">{t.dotStyleClassy}</option>
                  <option value="classy-rounded">{t.dotStyleClassyRounded}</option>
                  <option value="extra-rounded">{t.dotStyleExtraRounded}</option>
                  <option value="square">{t.dotStyleSquare}</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="select-ec-level">{t.ecLevelLabel}</label>
                <select
                  id="select-ec-level"
                  value={styleConfig.ecLevel}
                  onChange={(e) => handleChange('ecLevel', e.target.value)}
                >
                  <option value="L">{t.ecLevelL}</option>
                  <option value="M">{t.ecLevelM}</option>
                  <option value="Q">{t.ecLevelQ}</option>
                  <option value="H">{t.ecLevelH}</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="select-corner-outer">{t.cornerOuterLabel}</label>
                <select
                  id="select-corner-outer"
                  value={styleConfig.cornersSquareType}
                  onChange={(e) => handleChange('cornersSquareType', e.target.value)}
                >
                  <option value="extra-rounded">{t.cornerOuterExtraRounded}</option>
                  <option value="rounded">{t.cornerOuterRounded}</option>
                  <option value="dot">{t.cornerOuterDot}</option>
                  <option value="square">{t.cornerOuterSquare}</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="select-corner-inner">{t.cornerInnerLabel}</label>
                <select
                  id="select-corner-inner"
                  value={styleConfig.cornersDotType}
                  onChange={(e) => handleChange('cornersDotType', e.target.value)}
                >
                  <option value="rounded">{t.cornerInnerRounded}</option>
                  <option value="dot">{t.cornerInnerDot}</option>
                  <option value="square">{t.cornerInnerSquare}</option>
                </select>
              </div>

              <div className="input-group col-span-2">
                <div className="slider-label-row select-none">
                  <label htmlFor="range-margin">{t.quietZoneLabel}</label>
                  <span className="slider-val">{styleConfig.margin}px</span>
                </div>
                <input
                  type="range"
                  id="range-margin"
                  min="0"
                  max="40"
                  step="5"
                  value={styleConfig.margin}
                  onChange={(e) => handleChange('margin', parseInt(e.target.value, 10))}
                />
              </div>
            </div>
          </div>
        </details>

        {/* Accordion Section: Colors & Gradients */}
        <details className="accordion-item" open>
          <summary className="accordion-header">
            <h3>{t.colorsGradientsHeader}</h3>
            <svg className="accordion-chevron" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div className="accordion-body">
            <div className="form-grid">
              <div className="input-group col-span-2">
                <label>{t.fgTypeLabel}</label>
                <div className="radio-tab-container select-none">
                  <label className="radio-tab">
                    <input
                      type="radio"
                      name="fg-type"
                      value="single"
                      checked={styleConfig.fgType === 'single'}
                      onChange={() => handleChange('fgType', 'single')}
                    />
                    <span className="radio-tab-label">{t.fgTypeSolid}</span>
                  </label>
                  <label className="radio-tab">
                    <input
                      type="radio"
                      name="fg-type"
                      value="gradient"
                      checked={styleConfig.fgType === 'gradient'}
                      onChange={() => handleChange('fgType', 'gradient')}
                    />
                    <span className="radio-tab-label">{t.fgTypeGradient}</span>
                  </label>
                </div>
              </div>

              <div className="color-picker-row col-span-2">
                <div className="color-picker-item">
                  <label htmlFor="color-dots-primary">{t.dotsColorLabel}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      id="color-dots-primary"
                      value={styleConfig.dotsColor}
                      onChange={(e) => handleChange('dotsColor', e.target.value)}
                    />
                    <input
                      type="text"
                      id="color-dots-primary-text"
                      className="color-text-input"
                      value={styleConfig.dotsColor}
                      onChange={(e) => handleColorTextChange('dotsColor', e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>

                {styleConfig.fgType === 'gradient' && (
                  <div className="color-picker-item">
                    <label htmlFor="color-dots-secondary">{t.dotsSecondaryLabel}</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        id="color-dots-secondary"
                        value={styleConfig.dotsColorSecondary}
                        onChange={(e) => handleChange('dotsColorSecondary', e.target.value)}
                      />
                      <input
                        type="text"
                        id="color-dots-secondary-text"
                        className="color-text-input"
                        value={styleConfig.dotsColorSecondary}
                        onChange={(e) => handleColorTextChange('dotsColorSecondary', e.target.value)}
                        placeholder="#06b6d4"
                      />
                    </div>
                  </div>
                )}
              </div>

              {styleConfig.fgType === 'gradient' && (
                <div className="input-group col-span-2">
                  <div className="form-grid" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                    <div className="input-group">
                      <label htmlFor="select-gradient-type">{t.gradientStyleLabel}</label>
                      <select
                        id="select-gradient-type"
                        value={styleConfig.gradientType}
                        onChange={(e) => handleChange('gradientType', e.target.value)}
                      >
                        <option value="linear">{t.gradientStyleLinear}</option>
                        <option value="radial">{t.gradientStyleRadial}</option>
                      </select>
                    </div>

                    {styleConfig.gradientType === 'linear' && (
                      <div className="input-group">
                        <div className="slider-label-row select-none">
                          <label htmlFor="range-gradient-rotation">{t.gradientRotationLabel}</label>
                          <span className="slider-val">{styleConfig.gradientRotation}°</span>
                        </div>
                        <input
                          type="range"
                          id="range-gradient-rotation"
                          min="0"
                          max="360"
                          step="5"
                          value={styleConfig.gradientRotation}
                          onChange={(e) => handleChange('gradientRotation', parseInt(e.target.value, 10))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Colors for Corners Option */}
              <div className="checkbox-group col-span-2 select-none" style={{ marginTop: '5px' }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="toggle-custom-corners"
                    checked={styleConfig.customCorners}
                    onChange={(e) => handleChange('customCorners', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="checkbox-label">{t.customCornersLabel}</span>
              </div>

              {/* Dynamic Corners Colors Panel */}
              {styleConfig.customCorners && (
                <div className="color-picker-row col-span-2">
                  <div className="color-picker-item">
                    <label htmlFor="color-corner-outer">{t.outerFrameColorLabel}</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        id="color-corner-outer"
                        value={styleConfig.cornersSquareColor}
                        onChange={(e) => handleChange('cornersSquareColor', e.target.value)}
                      />
                      <input
                        type="text"
                        id="color-corner-outer-text"
                        className="color-text-input"
                        value={styleConfig.cornersSquareColor}
                        onChange={(e) => handleColorTextChange('cornersSquareColor', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="color-picker-item">
                    <label htmlFor="color-corner-inner">{t.innerCoreColorLabel}</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        id="color-corner-inner"
                        value={styleConfig.cornersDotColor}
                        onChange={(e) => handleChange('cornersDotColor', e.target.value)}
                      />
                      <input
                        type="text"
                        id="color-corner-inner-text"
                        className="color-text-input"
                        value={styleConfig.cornersDotColor}
                        onChange={(e) => handleColorTextChange('cornersDotColor', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <hr className="field-divider col-span-2" />

              {/* Background Color Picker */}
              <div className="color-picker-row col-span-2">
                <div className="color-picker-item">
                  <label htmlFor="color-bg">{t.bgColorLabel}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      id="color-bg"
                      value={styleConfig.bgTransparent ? '#ffffff' : styleConfig.bgColor}
                      disabled={styleConfig.bgTransparent}
                      onChange={(e) => handleChange('bgColor', e.target.value)}
                    />
                    <input
                      type="text"
                      id="color-bg-text"
                      className="color-text-input"
                      value={styleConfig.bgTransparent ? 'TRANSPARENT' : styleConfig.bgColor}
                      disabled={styleConfig.bgTransparent}
                      onChange={(e) => handleColorTextChange('bgColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="color-picker-item" style={{ justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                  <label>{t.transparentBgLabel}</label>
                  <div className="checkbox-group select-none" style={{ padding: '10px 0 0 0' }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="toggle-bg-transparent"
                        checked={styleConfig.bgTransparent}
                        onChange={(e) => handleChange('bgTransparent', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="checkbox-label">{t.transparentBgCheckboxLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Accordion Section: Logo & Icons */}
        <details className="accordion-item" open>
          <summary className="accordion-header">
            <h3>{t.logoIconHeader}</h3>
            <svg className="accordion-chevron" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>
          <div className="accordion-body">
            <div className="logo-custom-panel">
              {/* Preset selection */}
              <label className="field-label-header select-none">{t.quickPresetsLabel}</label>
              <div className="presets-grid select-none">
                <button
                  type="button"
                  className={`preset-btn ${styleConfig.logoPreset === 'none' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('none')}
                  title="No Logo"
                >
                  <span className="preset-icon-wrapper block-icon">Ø</span>
                  <span className="preset-title">{t.presetNone}</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${styleConfig.logoPreset === 'wifi' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('wifi')}
                  title="WiFi Connect"
                >
                  <svg className="preset-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                  </svg>
                  <span className="preset-title">{t.presetWifi}</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${styleConfig.logoPreset === 'web' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('web')}
                  title="Website/Globe"
                >
                  <svg className="preset-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path>
                  </svg>
                  <span className="preset-title">{t.presetGlobe}</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${styleConfig.logoPreset === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('whatsapp')}
                  title="WhatsApp Chat"
                >
                  <img className="preset-icon-img" src="/whatsapp.png" alt="WhatsApp" />
                  <span className="preset-title">{t.presetWhatsapp}</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${styleConfig.logoPreset === 'email' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('email')}
                  title="Direct Email"
                >
                  <svg className="preset-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span className="preset-title">{t.presetEmail}</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${styleConfig.logoPreset === 'github' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('github')}
                  title="GitHub Account"
                >
                  <svg className="preset-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="preset-title">{t.presetGithub}</span>
                </button>
                <button
                  type="button"
                  className={`preset-btn ${styleConfig.logoPreset === 'instagram' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('instagram')}
                  title="Instagram Profile"
                >
                  <img className="preset-icon-img" src="/instagram.png" alt="Instagram" />
                  <span className="preset-title">{t.presetInstagram}</span>
                </button>
              </div>

              <div className="dropzone-divider select-none">
                <span>{t.orUploadText}</span>
              </div>

              {/* Drop uploader */}
              {styleConfig.logoPreset !== 'custom' && !styleConfig.logoFile && (
                <div
                  className={`logo-dropzone ${isDragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerBrowse}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                    style={{ display: 'none' }}
                  />
                  <div className="dropzone-content select-none">
                    <svg className="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p className="dropzone-main-text">{t.dragDropText}</p>
                    <p className="dropzone-sub-text">{t.supportsText}</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerBrowse();
                      }}
                    >
                      {t.browseFilesBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* Logo status and controls */}
              {styleConfig.logoFile && (
                <div className="logo-controls-panel">
                  <div className="logo-status-row">
                    <div className="logo-preview-badge">
                      <img id="img-logo-preview" src={styleConfig.logoFile} alt="Uploaded Logo Preview" />
                    </div>
                    <div className="logo-info">
                      <span className="logo-filename">{styleConfig.logoFilename || 'logo.png'}</span>
                      <span className="logo-status-tag">{t.logoActiveTag}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-clear-logo"
                      onClick={clearLogo}
                      title="Remove logo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  <div className="form-grid" style={{ marginTop: '10px', padding: 0, background: 'transparent', border: 'none' }}>
                    <div className="input-group col-span-2" style={{ paddingBottom: 0 }}>
                      <div className="slider-label-row select-none">
                        <label htmlFor="range-logo-size">{t.logoScaleLabel}</label>
                        <span className="slider-val">{Math.round(styleConfig.logoScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        id="range-logo-size"
                        min="5"
                        max="45"
                        step="5"
                        value={Math.round(styleConfig.logoScale * 100)}
                        onChange={(e) => handleChange('logoScale', parseInt(e.target.value, 10) / 100)}
                      />
                    </div>

                    <div className="checkbox-group col-span-2 select-none">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          id="toggle-logo-bg"
                          checked={styleConfig.logoMargin}
                          onChange={(e) => handleChange('logoMargin', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="checkbox-label">{t.logoMarginLabel}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
