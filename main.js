/* ==========================================================================
   QRGo Application Core Logic
   Author: Henrique Silva (hfps.dev)
   ========================================================================== */

import QRCodeStyling from 'qr-code-styling';

// Translation Dictionary for Multilingual Support (Google SEO Optimized)
let currentLang = 'en';
const TRANSLATIONS = {
  en: {
    seoTitle: "QRGo | Premium Custom QR Code Generator",
    seoDesc: "Generate beautiful, custom styled QR codes with gradients, logos, custom shapes, and multiple data types like WiFi, vCard, Email, and URL. 100% client-side and free.",
    appTitle: "QRGo",
    appSubtitle: "Craft visually stunning, high-fidelity custom QR codes in real-time, completely client-side.",
    step1Title: "Content Type",
    tabUrl: "URL",
    tabText: "Text",
    tabWifi: "Wi-Fi",
    tabEmail: "Email",
    tabSms: "SMS / Phone",
    tabVcard: "vCard",
    labelUrl: "Website URL",
    tipUrl: "Provide a fully qualified URL for scanners to redirect instantly.",
    labelText: "Generic Text or Message",
    placeholderText: "Type your text or custom message here...",
    tipText: "Plain text displayed directly to the user upon scanning.",
    labelSsid: "Network SSID (Name)",
    placeholderSsid: "My Home Network",
    labelPass: "Password",
    placeholderPass: "••••••••",
    labelSecurity: "Security Mode",
    securityWpa: "WPA/WPA2",
    securityWep: "WEP",
    securityOpen: "Unsecured (Open)",
    labelHidden: "This is a hidden network SSID",
    labelEmailTo: "To Email Address",
    placeholderEmailTo: "hello@company.com",
    labelEmailSub: "Subject",
    placeholderEmailSub: "Inquiry about QRGo",
    labelEmailBody: "Email Body",
    placeholderEmailBody: "Hello Henrique, I saw your awesome AI styled QR Code tool...",
    labelSmsPhone: "Phone / Mobile Number",
    placeholderSmsPhone: "+1234567890",
    labelSmsBody: "SMS Body Message (Optional)",
    placeholderSmsBody: "Hi! Let's connect about the AI Developer role.",
    tipSms: "Scanning will launch the SMS app with this message prefilled.",
    labelFirst: "First Name",
    placeholderFirst: "Henrique",
    labelLast: "Last Name",
    placeholderLast: "Silva",
    labelCompany: "Company",
    placeholderCompany: "My Company",
    labelTitle: "Job Title",
    placeholderTitle: "Solutions Specialist",
    labelPhone: "Mobile Phone",
    placeholderPhone: "+351 912 345 678",
    labelEmail: "Work Email",
    placeholderEmail: "email@company.com",
    labelVcardUrl: "Website URL",
    placeholderVcardUrl: "https://hfps.dev",
    stylingHeader: "Styling & Customization",
    btnExportStyle: "Export Style Config",
    btnImportStyle: "Import Style Config",
    qrShapesHeader: "QR Shapes & Layout",
    dotPatternLabel: "Dot Pattern Style",
    dotStyleRounded: "Rounded Smooth",
    dotStyleDots: "Circular Dots",
    dotStyleClassy: "Classy Rounded",
    dotStyleClassyRounded: "Fluid Classy",
    dotStyleExtraRounded: "Extra Bulky Rounded",
    dotStyleSquare: "Standard Classic Square",
    ecLevelLabel: "Error Correction Level",
    ecLevelL: "L (7% Recovery)",
    ecLevelM: "M (15% Recovery)",
    ecLevelQ: "Q (25% Recovery)",
    ecLevelH: "H (30% Recovery - Recommended for logo)",
    cornerOuterLabel: "Corner Frame (Outer)",
    cornerOuterExtraRounded: "Extra Rounded",
    cornerOuterRounded: "Soft Rounded",
    cornerOuterDot: "Circular Ring",
    cornerOuterSquare: "Classic Square",
    cornerInnerLabel: "Corner Core (Inner)",
    cornerInnerRounded: "Soft Rounded",
    cornerInnerDot: "Circular Dot",
    cornerInnerSquare: "Classic Square",
    quietZoneLabel: "Quiet Zone Margin",
    colorsGradientsHeader: "Colors & Gradients",
    fgTypeLabel: "Foreground Type",
    fgTypeSolid: "Solid Color",
    fgTypeGradient: "Color Gradient",
    dotsColorLabel: "Dots Color",
    dotsSecondaryLabel: "Dots Secondary",
    gradientStyleLabel: "Gradient Style",
    gradientStyleLinear: "Linear Gradient",
    gradientStyleRadial: "Radial Glow",
    gradientRotationLabel: "Gradient Rotation",
    customCornersLabel: "Customize outer/inner corner colors separately",
    outerFrameColorLabel: "Outer Frame Color",
    innerCoreColorLabel: "Inner Core Color",
    bgColorLabel: "Background Canvas",
    transparentBgLabel: "Transparent Canvas",
    transparentBgCheckboxLabel: "Transparent",
    logoIconHeader: "Logo & Custom Icon",
    quickPresetsLabel: "Quick Presets",
    presetNone: "None",
    presetWifi: "WiFi",
    presetGlobe: "Globe",
    presetWhatsapp: "WhatsApp",
    presetEmail: "Email",
    presetGithub: "GitHub",
    presetInstagram: "Instagram",
    scanModalTitle: "Scan QR Code",
    scanModalSubtitle: "Point your camera at a QR code to import its content.",
    scanModalHint: "Content will be loaded into the URL or Text field automatically.",
    scanSuccessMsg: "QR code detected!",
    orUploadText: "or upload custom image",
    dragDropText: "Drag & drop your logo here",
    supportsText: "Supports SVG, PNG, JPG (Max 2MB)",
    browseFilesBtn: "Browse Files",
    logoScaleLabel: "Logo Scale (Size)",
    logoMarginLabel: "Add solid white protective margin behind logo",
    logoActiveTag: "Active",
    liveWorkspaceHeader: "Live Workspace",
    livePreviewIndicator: "Live Preview",
    scannerTipText: "Point your smartphone camera to test the scan in real-time.",
    btnDownloadPng: "Download PNG",
    btnDownloadSvg: "Download SVG (Vector)",
    btnScanQr: "Scan & Import QR",
    btnCopyContent: "Copy current content to clipboard",
    footerCredit: '© 2026 QRGo. Developed by <strong>Henrique Silva</strong>. Check out my website at <a href="https://hfps.dev" target="_blank" class="footer-link">hfps.dev</a>.',
    techStackInfo: "Powered by Vite • Vanilla CSS • qr-code-styling",
    alertCopySuccess: "Copied successfully!",
    alertInvalidFile: "Invalid file format. Please upload a valid JSON config file.",
    alertInvalidImage: "Please upload a valid image file (PNG, JPG, SVG).",
    alertFileTooLarge: "The file is too large. Max size allowed is 2MB.",
    alertImportSuccess: "Configuration imported successfully!",
    alertImportFail: "Failed to apply imported configuration: ",
    alertCopyFail: "Failed to copy text: ",
    textDefaultFallback: "QRGo premium styled QR code!",
    wifiDefaultSsid: "QRGo_Guest",
    vcardDefaultName: "QRGo User"
  },
  pt: {
    seoTitle: "QRGo | Gerador de QR Code Customizado Premium",
    seoDesc: "Gere QR codes bonitos e customizados com degradês, logotipos, formas personalizadas e múltiplos tipos de dados como WiFi, vCard, Email e URL. 100% cliente-side e grátis.",
    appTitle: "QRGo",
    appSubtitle: "Crie códigos QR personalizados de alta fidelidade e visualmente deslumbrantes em tempo real, totalmente no lado do cliente.",
    step1Title: "Tipo de Conteúdo",
    tabUrl: "URL",
    tabText: "Texto",
    tabWifi: "Wi-Fi",
    tabEmail: "E-mail",
    tabSms: "SMS / Telefone",
    tabVcard: "vCard",
    labelUrl: "URL do Website",
    tipUrl: "Forneça um URL qualificado para redirecionamento instantâneo após escaneamento.",
    labelText: "Texto Genérico ou Mensagem",
    placeholderText: "Digite seu texto ou mensagem personalizada aqui...",
    tipText: "Texto simples exibido diretamente ao utilizador após a leitura.",
    labelSsid: "SSID da Rede (Nome)",
    placeholderSsid: "Minha Rede Doméstica",
    labelPass: "Palavra-passe / Senha",
    placeholderPass: "••••••••",
    labelSecurity: "Modo de Segurança",
    securityWpa: "WPA/WPA2",
    securityWep: "WEP",
    securityOpen: "Sem Senha (Aberta)",
    labelHidden: "Esta é uma rede com SSID oculto",
    labelEmailTo: "Endereço de E-mail de Destino",
    placeholderEmailTo: "ola@empresa.com",
    labelEmailSub: "Assunto",
    placeholderEmailSub: "Contacto sobre QRGo",
    labelEmailBody: "Corpo do E-mail",
    placeholderEmailBody: "Olá Henrique, vi a sua incrível ferramenta de QR Codes personalizados com IA...",
    labelSmsPhone: "Número de Telefone / Telemóvel",
    placeholderSmsPhone: "+351912345678",
    labelSmsBody: "Mensagem do SMS (Opcional)",
    placeholderSmsBody: "Olá! Gostaria de falar sobre a vaga de Programador de IA.",
    tipSms: "O escaneamento abrirá a aplicação de SMS com esta mensagem preenchida.",
    labelFirst: "Primeiro Nome",
    placeholderFirst: "Henrique",
    labelLast: "Último Nome / Apelido",
    placeholderLast: "Silva",
    labelCompany: "Empresa",
    placeholderCompany: "Minha Empresa",
    labelTitle: "Cargo / Função",
    placeholderTitle: "Especialista de Soluções",
    labelPhone: "Telemóvel / Celular",
    placeholderPhone: "+351 912 345 678",
    labelEmail: "E-mail de Trabalho",
    placeholderEmail: "email@empresa.com",
    labelVcardUrl: "URL do Website",
    placeholderVcardUrl: "https://hfps.dev",
    stylingHeader: "Estilização & Personalização",
    btnExportStyle: "Exportar Config de Estilo",
    btnImportStyle: "Importar Config de Estilo",
    qrShapesHeader: "Formato & Layout do QR",
    dotPatternLabel: "Estilo do Padrão dos Pontos",
    dotStyleRounded: "Arredondado Suave",
    dotStyleDots: "Pontos Circulares",
    dotStyleClassy: "Arredondado Elegante",
    dotStyleClassyRounded: "Fluido Elegante",
    dotStyleExtraRounded: "Super Arredondado",
    dotStyleSquare: "Quadrado Clássico Padrão",
    ecLevelLabel: "Nível de Correção de Erros",
    ecLevelL: "L (7% Recuperação)",
    ecLevelM: "M (15% Recuperação)",
    ecLevelQ: "Q (25% Recuperação)",
    ecLevelH: "H (30% Recuperação - Recomendado para logo)",
    cornerOuterLabel: "Moldura dos Cantos (Exterior)",
    cornerOuterExtraRounded: "Extra Arredondado",
    cornerOuterRounded: "Arredondado Suave",
    cornerOuterDot: "Anel Circular",
    cornerOuterSquare: "Quadrado Clássico",
    cornerInnerLabel: "Centro dos Cantos (Interior)",
    cornerInnerRounded: "Arredondado Suave",
    cornerInnerDot: "Ponto Circular",
    cornerInnerSquare: "Quadrado Clássico",
    quietZoneLabel: "Margem da Zona Silenciosa",
    colorsGradientsHeader: "Cores & Degradês",
    fgTypeLabel: "Tipo do Primeiro Plano",
    fgTypeSolid: "Cor Sólida",
    fgTypeGradient: "Gradiente de Cores",
    dotsColorLabel: "Cor dos Pontos",
    dotsSecondaryLabel: "Cor Secundária dos Pontos",
    gradientStyleLabel: "Estilo do Gradiente",
    gradientStyleLinear: "Gradiente Linear",
    gradientStyleRadial: "Brilho Radial",
    gradientRotationLabel: "Rotação do Gradiente",
    customCornersLabel: "Personalizar cores dos cantos internos/externos separadamente",
    outerFrameColorLabel: "Cor da Moldura Externa",
    innerCoreColorLabel: "Cor do Centro Interno",
    bgColorLabel: "Tela de Fundo",
    transparentBgLabel: "Fundo Transparente",
    transparentBgCheckboxLabel: "Transparente",
    logoIconHeader: "Logótipo & Ícone Customizado",
    quickPresetsLabel: "Modelos Rápidos",
    presetNone: "Nenhum",
    presetWifi: "WiFi",
    presetGlobe: "Globo",
    presetWhatsapp: "WhatsApp",
    presetEmail: "E-mail",
    presetGithub: "GitHub",
    presetInstagram: "Instagram",
    scanModalTitle: "Escanear QR Code",
    scanModalSubtitle: "Aponte a câmara para um QR code para importar o seu conteúdo.",
    scanModalHint: "O conteúdo será carregado automaticamente no campo URL ou Texto.",
    scanSuccessMsg: "QR code detetado!",
    orUploadText: "ou envie uma imagem personalizada",
    dragDropText: "Arraste e solte o seu logotipo aqui",
    supportsText: "Suporta SVG, PNG, JPG (Máx 2MB)",
    browseFilesBtn: "Procurar Ficheiros",
    logoScaleLabel: "Escala do Logo (Tamanho)",
    logoMarginLabel: "Adicionar margem protetora branca sólida atrás do logo",
    logoActiveTag: "Ativo",
    liveWorkspaceHeader: "Espaço de Trabalho Ativo",
    livePreviewIndicator: "Live Preview",
    scannerTipText: "Aponte a câmara do telemóvel para testar a leitura em tempo real.",
    btnDownloadPng: "Descarregar PNG",
    btnDownloadSvg: "Descarregar SVG (Vetor)",
    btnScanQr: "Escanear e Importar QR",
    btnCopyContent: "Copiar conteúdo atual",
    footerCredit: '© 2026 QRGo. Desenvolvido por <strong>Henrique Silva</strong>. Conheça o meu website em <a href="https://hfps.dev" target="_blank" class="footer-link">hfps.dev</a>.',
    techStackInfo: "Desenvolvido com Vite • Vanilla CSS • qr-code-styling",
    alertCopySuccess: "Copiado com sucesso!",
    alertInvalidFile: "Formato de ficheiro inválido. Por favor, envie um ficheiro JSON de configuração válido.",
    alertInvalidImage: "Por favor, envie um ficheiro de imagem válido (PNG, JPG, SVG).",
    alertFileTooLarge: "O ficheiro é muito grande. O tamanho máximo permitido é 2MB.",
    alertImportSuccess: "Configuração importada com sucesso!",
    alertImportFail: "Falha ao aplicar a configuração importada: ",
    alertCopyFail: "Falha ao copiar o texto: ",
    textDefaultFallback: "QR Code personalizado premium da QRGo!",
    wifiDefaultSsid: "QRGo_Visitas",
    vcardDefaultName: "Utilizador QRGo"
  },
  es: {
    seoTitle: "QRGo | Generador de Código QR Personalizado Premium",
    seoDesc: "Genere códigos QR hermosos y personalizados con degradados, logotipos, formas personalizadas y múltiples tipos de datos como WiFi, vCard, Correo y URL. 100% del lado del cliente y gratis.",
    appTitle: "QRGo",
    appSubtitle: "Cree códigos QR personalizados de alta fidelidad y visualmente deslumbrantes en tiempo real, totalmente del lado del cliente.",
    step1Title: "Tipo de Contenido",
    tabUrl: "URL",
    tabText: "Texto",
    tabWifi: "Wi-Fi",
    tabEmail: "Email",
    tabSms: "SMS / Teléfono",
    tabVcard: "vCard",
    labelUrl: "URL del Sitio Web",
    tipUrl: "Proporcione una URL calificada para redireccionar instantáneamente tras el escaneo.",
    labelText: "Texto Genérico o Mensaje",
    placeholderText: "Escriba su texto o mensaje personalizado aquí...",
    tipText: "Texto plano mostrado directamente al usuario después del escaneo.",
    labelSsid: "SSID de Red (Nombre)",
    placeholderSsid: "Mi Red Doméstica",
    labelPass: "Contraseña",
    placeholderPass: "••••••••",
    labelSecurity: "Modo de Seguridad",
    securityWpa: "WPA/WPA2",
    securityWep: "WEP",
    securityOpen: "Sin contraseña (Abierta)",
    labelHidden: "Esta es una red con SSID oculto",
    labelEmailTo: "Dirección de Correo Destino",
    placeholderEmailTo: "hola@empresa.com",
    labelEmailSub: "Asunto",
    placeholderEmailSub: "Contacto sobre QRGo",
    labelEmailBody: "Cuerpo del Correo",
    placeholderEmailBody: "Hola Henrique, vi tu increíble herramienta de códigos QR personalizados con IA...",
    labelSmsPhone: "Número de Teléfono / Móvil",
    placeholderSmsPhone: "+34612345678",
    labelSmsBody: "Mensaje de SMS (Opcional)",
    placeholderSmsBody: "¡Hola! Me gustaría hablar sobre la vacante de Desarrollador de IA.",
    tipSms: "El escaneo abrirá la aplicación de SMS con este mensaje precompletado.",
    labelFirst: "Nombre",
    placeholderFirst: "Henrique",
    labelLast: "Apellido",
    placeholderLast: "Silva",
    labelCompany: "Empresa",
    placeholderCompany: "Mi Empresa",
    labelTitle: "Cargo / Puesto",
    placeholderTitle: "Especialista de Soluciones",
    labelPhone: "Teléfono Móvil",
    placeholderPhone: "+34 612 345 678",
    labelEmail: "Correo de Trabajo",
    placeholderEmail: "correo@empresa.com",
    labelVcardUrl: "URL del Sitio Web",
    placeholderVcardUrl: "https://hfps.dev",
    stylingHeader: "Estilización y Personalización",
    btnExportStyle: "Exportar Config de Estilo",
    btnImportStyle: "Importar Config de Estilo",
    qrShapesHeader: "Formatos y Diseño del QR",
    dotPatternLabel: "Estilo del Patrón de Puntos",
    dotStyleRounded: "Redondeado Suave",
    dotStyleDots: "Puntos Circulares",
    dotStyleClassy: "Redondeado Elegante",
    dotStyleClassyRounded: "Fluido Elegante",
    dotStyleExtraRounded: "Súper Redondeado",
    dotStyleSquare: "Cuadrado Clásico Estándar",
    ecLevelLabel: "Nivel de Corrección de Errores",
    ecLevelL: "L (7% Recuperación)",
    ecLevelM: "M (15% Recuperación)",
    ecLevelQ: "Q (25% Recuperación)",
    ecLevelH: "H (30% Recuperación - Recomendado para logo)",
    cornerOuterLabel: "Marco de Esquinas (Exterior)",
    cornerOuterExtraRounded: "Extra Redondeado",
    cornerOuterRounded: "Redondeado Suave",
    cornerOuterDot: "Anillo Circular",
    cornerOuterSquare: "Cuadrado Clásico",
    cornerInnerLabel: "Centro de Esquinas (Interior)",
    cornerInnerRounded: "Redondeado Suave",
    cornerInnerDot: "Punto Circular",
    cornerInnerSquare: "Cuadrado Clásico",
    quietZoneLabel: "Margen de Zona Silenciosa",
    colorsGradientsHeader: "Colores y Degradados",
    fgTypeLabel: "Tipo de Frente",
    fgTypeSolid: "Color Sólido",
    fgTypeGradient: "Gradiente de Colores",
    dotsColorLabel: "Color de Puntos",
    dotsSecondaryLabel: "Color Secundario de Puntos",
    gradientStyleLabel: "Estilo de Gradiente",
    gradientStyleLinear: "Gradiente Lineal",
    gradientStyleRadial: "Brillo Radial",
    gradientRotationLabel: "Rotación del Gradiente",
    customCornersLabel: "Personalizar colores de esquinas internas/externas por separado",
    outerFrameColorLabel: "Color de Marco Externo",
    innerCoreColorLabel: "Color de Centro Interno",
    bgColorLabel: "Lienzo de Fondo",
    transparentBgLabel: "Lienzo Transparente",
    transparentBgCheckboxLabel: "Transparente",
    logoIconHeader: "Logotipo e Icono Personalizado",
    quickPresetsLabel: "Ajustes Rápidos",
    presetNone: "Ninguno",
    presetWifi: "WiFi",
    presetGlobe: "Globo",
    presetWhatsapp: "WhatsApp",
    presetEmail: "Email",
    presetGithub: "GitHub",
    presetInstagram: "Instagram",
    scanModalTitle: "Escanear Código QR",
    scanModalSubtitle: "Apunte la cámara a un código QR para importar su contenido.",
    scanModalHint: "El contenido se cargará automáticamente en el campo URL o Texto.",
    scanSuccessMsg: "¡Código QR detectado!",
    orUploadText: "o suba una imagen personalizada",
    dragDropText: "Arrastre y suelte su logotipo aquí",
    supportsText: "Soporta SVG, PNG, JPG (Max 2MB)",
    browseFilesBtn: "Buscar Archivos",
    logoScaleLabel: "Escala de Logo (Tamaño)",
    logoMarginLabel: "Añadir margen protector blanco sólido detrás del logo",
    logoActiveTag: "Activo",
    liveWorkspaceHeader: "Espacio de Trabajo Activo",
    livePreviewIndicator: "Vista Previa",
    scannerTipText: "Apunte la cámara de su móvil para probar el escaneo en tiempo real.",
    btnDownloadPng: "Descargar PNG",
    btnDownloadSvg: "Descargar SVG (Vector)",
    btnScanQr: "Escanear e Importar QR",
    btnCopyContent: "Copiar contenido actual",
    footerCredit: '© 2026 QRGo. Desarrollado por <strong>Henrique Silva</strong>. Visite mi sitio web en <a href="https://hfps.dev" target="_blank" class="footer-link">hfps.dev</a>.',
    techStackInfo: "Desarrollado con Vite • Vanilla CSS • qr-code-styling",
    alertCopySuccess: "¡Copiado con éxito!",
    alertInvalidFile: "Formato de archivo inválido. Por favor, suba un archivo JSON de configuración válido.",
    alertInvalidImage: "Por favor, suba un archivo de imagen válido (PNG, JPG, SVG).",
    alertFileTooLarge: "El archivo es demasiado grande. El tamaño máximo permitido es de 2MB.",
    alertImportSuccess: "¡Configuración importada con éxito!",
    alertImportFail: "No se pudo aplicar la configuración importada: ",
    alertCopyFail: "No se pudo copiar el texto: ",
    textDefaultFallback: "¡Código QR personalizado premium de QRGo!",
    wifiDefaultSsid: "QRGo_Invitados",
    vcardDefaultName: "Usuario QRGo"
  }
};

// 1. App State
let qrCode = null;
let activeTab = 'url';
let uploadedLogoDataUrl = null;
let uploadedLogoName = '';
let activePreset = 'none'; // 'none', 'wifi', 'web', 'whatsapp', 'email', 'github', 'instagram', 'custom'

// Language Initialization & SEO Synchronization
function initLanguage() {
  const storedLang = localStorage.getItem('qrgo_lang');
  if (storedLang && ['en', 'pt', 'es'].includes(storedLang)) {
    applyLanguage(storedLang);
  } else {
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const parsedLang = browserLang.substring(0, 2).toLowerCase();
    
    if (['en', 'pt', 'es'].includes(parsedLang)) {
      applyLanguage(parsedLang);
    } else {
      applyLanguage('en');
    }
  }

  const langSelect = document.getElementById('lang-selector');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      localStorage.setItem('qrgo_lang', selected);
      applyLanguage(selected);
      updateQR();
    });
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  
  const i18nElements = document.querySelectorAll('[data-i18n]');
  i18nElements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      if (key === 'footerCredit') {
        el.innerHTML = TRANSLATIONS[lang][key];
      } else {
        el.textContent = TRANSLATIONS[lang][key];
      }
    }
  });

  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.setAttribute('placeholder', TRANSLATIONS[lang][key]);
    }
  });

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

  const langSelect = document.getElementById('lang-selector');
  if (langSelect) langSelect.value = lang;
}

// SVG Preset Logos (Clean high-contrast vector data URLs for professional theme)
const PRESET_LOGOS = {
  wifi: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
  
  web: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230d9488" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  
  whatsapp: `/whatsapp.png`,
  
  email: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  
  github: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230f172a"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,

  instagram: `/instagram.png`
};


// 2. Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  setupTabs();
  setupColorSync();
  setupSliders();
  setupLogoHandlers();
  setupInputListeners();
  setupActionListeners();
  setupMobileFABs();
  setupQRScanner();
  
  // Render initial QR Code
  initQR();
});

// 3. Setup Functions

// Tabs navigation toggle
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate current
      document.querySelector('.tab-btn.active').classList.remove('active');
      document.querySelector('.tab-pane.active').classList.remove('active');
      
      // Activate new
      tab.classList.add('active');
      const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
      targetPane.classList.add('active');
      
      activeTab = tab.dataset.tab;
      
      // Auto upgrade EC Level or update options depending on preset matching
      handleTabChangeDefaults();
      updateQR();
    });
  });
}

// Set up automatic defaults depending on content types (e.g. WiFi active presets)
function handleTabChangeDefaults() {
  // If user clicks WiFi tab, auto suggest WiFi preset logo if none chosen
  if (activeTab === 'wifi') {
    const wifiPresetBtn = document.querySelector('.preset-btn[data-preset="wifi"]');
    if (activePreset === 'none') {
      wifiPresetBtn.click();
    }
  } else if (activeTab === 'email') {
    const emailPresetBtn = document.querySelector('.preset-btn[data-preset="email"]');
    if (activePreset === 'wifi') {
      emailPresetBtn.click();
    }
  } else if (activeTab === 'url') {
    const webPresetBtn = document.querySelector('.preset-btn[data-preset="web"]');
    if (activePreset === 'wifi' || activePreset === 'email') {
      webPresetBtn.click();
    }
  }
}

// Sync visual color pickers and raw hex inputs
function setupColorSync() {
  const colorSyncPairs = [
    { picker: 'color-dots-primary', text: 'color-dots-primary-text' },
    { picker: 'color-dots-secondary', text: 'color-dots-secondary-text' },
    { picker: 'color-corner-outer', text: 'color-corner-outer-text' },
    { picker: 'color-corner-inner', text: 'color-corner-inner-text' },
    { picker: 'color-bg', text: 'color-bg-text' }
  ];

  colorSyncPairs.forEach(pair => {
    const pickerEl = document.getElementById(pair.picker);
    const textEl = document.getElementById(pair.text);

    // Sync from picker to text input
    pickerEl.addEventListener('input', (e) => {
      textEl.value = e.target.value.toUpperCase();
      updateQR();
    });

    // Sync from text input to picker (handles raw hex typing)
    textEl.addEventListener('input', (e) => {
      let val = e.target.value;
      if (!val.startsWith('#')) {
        val = '#' + val;
      }
      // Simple validation for 3/6 digit hex
      if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
        pickerEl.value = val;
        updateQR();
      }
    });
  });

  // Solid Color vs Gradient toggle
  const fgTypeRadios = document.querySelectorAll('input[name="fg-type"]');
  fgTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const gradientOptions = document.getElementById('row-gradient-options');
      const secondaryColor = document.getElementById('item-dots-secondary');
      
      if (e.target.value === 'gradient') {
        gradientOptions.classList.remove('hidden');
        secondaryColor.classList.remove('hidden');
      } else {
        gradientOptions.classList.add('hidden');
        secondaryColor.classList.add('hidden');
      }
      updateQR();
    });
  });

  // Custom Corner Colors toggle
  const customCornersToggle = document.getElementById('toggle-custom-corners');
  customCornersToggle.addEventListener('change', (e) => {
    const cornersPanel = document.getElementById('row-corners-colors');
    if (e.target.checked) {
      cornersPanel.classList.remove('hidden');
    } else {
      cornersPanel.classList.add('hidden');
    }
    updateQR();
  });

  // Background Transparency toggle
  const bgTransparentToggle = document.getElementById('toggle-bg-transparent');
  bgTransparentToggle.addEventListener('change', (e) => {
    const bgPickerWrapper = document.getElementById('color-bg').closest('.color-picker-item');
    if (e.target.checked) {
      bgPickerWrapper.style.opacity = '0.3';
      bgPickerWrapper.style.pointerEvents = 'none';
    } else {
      bgPickerWrapper.style.opacity = '1';
      bgPickerWrapper.style.pointerEvents = 'auto';
    }
    updateQR();
  });
}

// Update text markers on slider drags
function setupSliders() {
  const sliders = [
    { slider: 'range-margin', val: 'val-margin', suffix: 'px' },
    { slider: 'range-gradient-rotation', val: 'val-gradient-rotation', suffix: '°' },
    { slider: 'range-logo-size', val: 'val-logo-size', suffix: '%' }
  ];

  sliders.forEach(item => {
    const sliderEl = document.getElementById(item.slider);
    const valEl = document.getElementById(item.val);

    sliderEl.addEventListener('input', (e) => {
      valEl.textContent = e.target.value + item.suffix;
      updateQR();
    });
  });
}

// Handle Preset selection and Dropzone Drag-and-Drop uploads
function setupLogoHandlers() {
  const presetButtons = document.querySelectorAll('.preset-btn');
  const dropzone = document.getElementById('logo-dropzone');
  const fileInput = document.getElementById('logo-input');
  const browseBtn = document.getElementById('btn-browse-logo');
  const clearLogoBtn = document.getElementById('btn-clear-logo');
  const logoControls = document.getElementById('logo-active-controls');
  const logoPreview = document.getElementById('img-logo-preview');
  const logoNameLbl = document.getElementById('lbl-logo-name');

  // Preset click handlers
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active classes
      document.querySelector('.preset-btn.active')?.classList.remove('active');
      
      // Make active
      btn.classList.add('active');
      activePreset = btn.dataset.preset;

      if (activePreset === 'none') {
        logoControls.classList.add('hidden');
        dropzone.classList.remove('hidden');
        uploadedLogoDataUrl = null;
      } else {
        logoControls.classList.add('hidden');
        dropzone.classList.remove('hidden');
      }
      
      // Auto adjust Error Correction to H (high recovery) when adding a logo
      const ecSelector = document.getElementById('select-ec-level');
      if (activePreset !== 'none') {
        ecSelector.value = 'H';
      }
      
      updateQR();
    });
  });

  // Dropzone click & browse file
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Avoid triggering dropzone click
    fileInput.click();
  });
  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleLogoFile(e.target.files[0]);
    }
  });

  // Dropzone drag-and-drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleLogoFile(files[0]);
    }
  });

  // Remove logo functionality
  clearLogoBtn.addEventListener('click', () => {
    uploadedLogoDataUrl = null;
    uploadedLogoName = '';
    activePreset = 'none';
    
    // Select the None preset button
    document.querySelector('.preset-btn.active')?.classList.remove('active');
    document.querySelector('.preset-btn[data-preset="none"]').classList.add('active');
    
    logoControls.classList.add('hidden');
    dropzone.classList.remove('hidden');
    fileInput.value = '';
    
    updateQR();
  });

  // Process selected file
  function handleLogoFile(file) {
    if (!file.type.match('image.*')) {
      alert(TRANSLATIONS[currentLang]['alertInvalidImage'] || 'Please upload a valid image file (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(TRANSLATIONS[currentLang]['alertFileTooLarge'] || 'The file is too large. Max size allowed is 2MB.');
      return;
    }

    uploadedLogoName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedLogoDataUrl = e.target.result;
      activePreset = 'custom';
      
      // Update UI panels
      document.querySelector('.preset-btn.active')?.classList.remove('active');
      dropzone.classList.add('hidden');
      logoControls.classList.remove('hidden');
      
      logoPreview.src = uploadedLogoDataUrl;
      logoNameLbl.textContent = uploadedLogoName;
      
      // Auto-set High error correction
      document.getElementById('select-ec-level').value = 'H';
      
      updateQR();
    };
    reader.readAsDataURL(file);
  }
}

// Add general change listeners to all form controls for instant updating
function setupInputListeners() {
  // Select fields & checkboxes
  const formControls = [
    'select-dot-style',
    'select-ec-level',
    'select-corner-outer',
    'select-corner-inner',
    'toggle-logo-bg'
  ];

  formControls.forEach(id => {
    document.getElementById(id).addEventListener('change', updateQR);
  });

  // Input changes (text, links, wifi, sms, emails)
  const textInputs = [
    'input-url', 'input-text',
    'input-wifi-ssid', 'input-wifi-pass', 'input-wifi-type', 'input-wifi-hidden',
    'input-email-to', 'input-email-sub', 'input-email-body',
    'input-sms-phone', 'input-sms-body',
    'input-vcard-first', 'input-vcard-last', 'input-vcard-company',
    'input-vcard-title', 'input-vcard-phone', 'input-vcard-email', 'input-vcard-url'
  ];

  textInputs.forEach(id => {
    document.getElementById(id).addEventListener('input', updateQR);
  });
}

// Download, Clipboard & Style Config exports/imports setup
function setupActionListeners() {
  document.getElementById('btn-download-png').addEventListener('click', () => {
    if (qrCode) {
      triggerGlowEffect();
      qrCode.download({ name: `qrgo_${activeTab}`, extension: 'png' });
    }
  });

  document.getElementById('btn-download-svg').addEventListener('click', () => {
    if (qrCode) {
      triggerGlowEffect();
      qrCode.download({ name: `qrgo_${activeTab}`, extension: 'svg' });
    }
  });

  document.getElementById('btn-copy-link').addEventListener('click', () => {
    const rawData = getQRData();
    navigator.clipboard.writeText(rawData)
      .then(() => {
        const btn = document.getElementById('btn-copy-link');
        const originalText = btn.innerHTML;
        const successMsg = TRANSLATIONS[currentLang]['alertCopySuccess'] || 'Copied successfully!';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${successMsg}`;
        btn.style.color = 'var(--color-emerald)';
        triggerGlowEffect();
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.color = '';
        }, 2000);
      })
      .catch(err => {
        alert((TRANSLATIONS[currentLang]['alertCopyFail'] || 'Failed to copy text: ') + err);
      });
  });

  // Export Theme click handler
  document.getElementById('btn-export-style').addEventListener('click', () => {
    exportStyleConfig();
  });

  // Import Theme click triggers click on hidden file input
  const importBtn = document.getElementById('btn-import-style');
  const importInput = document.getElementById('input-import-style');
  importBtn.addEventListener('click', () => {
    importInput.click();
  });

  // Handle selected JSON file for theme import
  importInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target.result);
          importStyleConfig(config);
        } catch (err) {
          alert(TRANSLATIONS[currentLang]['alertInvalidFile'] || 'Invalid file format. Please upload a valid JSON config file.');
        }
      };
      reader.readAsText(file);
      // Reset input value so same file can be selected again
      importInput.value = '';
    }
  });
}

// Visual interactive trigger glow on QR card
function triggerGlowEffect() {
  const frame = document.querySelector('.qr-canvas-outer-frame');
  frame.style.transform = 'scale(0.97)';
  frame.style.borderColor = 'var(--color-violet)';
  frame.style.boxShadow = '0 0 25px var(--color-violet-glow)';
  setTimeout(() => {
    frame.style.transform = '';
    frame.style.borderColor = '';
    frame.style.boxShadow = '';
  }, 300);
}

// 4. Formatting Output Strings depending on Selected Tab
function getQRData() {
  switch (activeTab) {
    case 'url':
      let url = document.getElementById('input-url').value.trim();
      if (url === '') return 'https://hfps.dev';
      // Auto prepend https if no protocol present
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return url;

    case 'text':
      const text = document.getElementById('input-text').value;
      return text || TRANSLATIONS[currentLang]['textDefaultFallback'] || 'QRGo premium styled QR code!';

    case 'wifi':
      const ssid = document.getElementById('input-wifi-ssid').value;
      const pass = document.getElementById('input-wifi-pass').value;
      const type = document.getElementById('input-wifi-type').value;
      const hidden = document.getElementById('input-wifi-hidden').checked;
      
      if (!ssid) {
        const defaultSsid = TRANSLATIONS[currentLang]['wifiDefaultSsid'] || 'QRGo_Guest';
        return `WIFI:S:${defaultSsid};T:WPA;P:;;`;
      }
      return `WIFI:S:${ssid};T:${type};P:${pass};H:${hidden ? 'true' : 'false'};;`;

    case 'email':
      const to = document.getElementById('input-email-to').value.trim();
      const sub = document.getElementById('input-email-sub').value;
      const body = document.getElementById('input-email-body').value;
      
      if (!to) return 'mailto:hello@company.com';
      return `mailto:${to}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;

    case 'sms':
      const phone = document.getElementById('input-sms-phone').value.trim();
      const smsBody = document.getElementById('input-sms-body').value;
      
      if (!phone) return 'SMSTO:';
      return `SMSTO:${phone}:${smsBody}`;

    case 'vcard':
      const first = document.getElementById('input-vcard-first').value.trim();
      const last = document.getElementById('input-vcard-last').value.trim();
      const company = document.getElementById('input-vcard-company').value.trim();
      const title = document.getElementById('input-vcard-title').value.trim();
      const cell = document.getElementById('input-vcard-phone').value.trim();
      const mail = document.getElementById('input-vcard-email').value.trim();
      const website = document.getElementById('input-vcard-url').value.trim();

      if (!first && !last) {
        const defaultName = TRANSLATIONS[currentLang]['vcardDefaultName'] || 'QRGo User';
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${defaultName}\nEND:VCARD`;
      }

      let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
      vcard += `N:${last};${first};;;\n`;
      vcard += `FN:${first} ${last}\n`;
      if (company) vcard += `ORG:${company}\n`;
      if (title) vcard += `TITLE:${title}\n`;
      if (cell) vcard += `TEL;TYPE=CELL:${cell}\n`;
      if (mail) vcard += `EMAIL;TYPE=WORK,INTERNET:${mail}\n`;
      if (website) vcard += `URL:${website}\n`;
      vcard += 'END:VCARD';
      return vcard;

    default:
      return 'https://hfps.dev';
  }
}

// 5. Export and Import Style Configuration Logic

// Serializes the DOM properties into a JSON download trigger
function exportStyleConfig() {
  const config = {
    dotStyle: document.getElementById('select-dot-style').value,
    ecLevel: document.getElementById('select-ec-level').value,
    cornerOuter: document.getElementById('select-corner-outer').value,
    cornerInner: document.getElementById('select-corner-inner').value,
    margin: parseInt(document.getElementById('range-margin').value, 10),
    fgType: document.querySelector('input[name="fg-type"]:checked').value,
    primaryColor: document.getElementById('color-dots-primary').value,
    secondaryColor: document.getElementById('color-dots-secondary').value,
    gradientType: document.getElementById('select-gradient-type').value,
    gradientRotation: parseInt(document.getElementById('range-gradient-rotation').value, 10),
    hasCustomCorners: document.getElementById('toggle-custom-corners').checked,
    cornerOuterColor: document.getElementById('color-corner-outer').value,
    cornerInnerColor: document.getElementById('color-corner-inner').value,
    isTransparent: document.getElementById('toggle-bg-transparent').checked,
    bgColor: document.getElementById('color-bg').value,
    activePreset: activePreset,
    logoScale: parseInt(document.getElementById('range-logo-size').value, 10),
    hasLogoBg: document.getElementById('toggle-logo-bg').checked,
    uploadedLogoDataUrl: uploadedLogoDataUrl, // base64 representation to save user uploads!
    uploadedLogoName: uploadedLogoName
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "qrgo_style_config.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Parses JSON and updates all styling DOM controls in real-time
function importStyleConfig(config) {
  try {
    // 1. Shapes Setup
    if (config.dotStyle) document.getElementById('select-dot-style').value = config.dotStyle;
    if (config.ecLevel) document.getElementById('select-ec-level').value = config.ecLevel;
    if (config.cornerOuter) document.getElementById('select-corner-outer').value = config.cornerOuter;
    if (config.cornerInner) document.getElementById('select-corner-inner').value = config.cornerInner;
    if (config.margin !== undefined) {
      document.getElementById('range-margin').value = config.margin;
      document.getElementById('val-margin').textContent = config.margin + 'px';
    }

    // 2. Foreground Type & Primary Colors Setup
    if (config.fgType) {
      const radio = document.querySelector(`input[name="fg-type"][value="${config.fgType}"]`);
      if (radio) {
        radio.checked = true;
        const gradientOptions = document.getElementById('row-gradient-options');
        const secondaryColor = document.getElementById('item-dots-secondary');
        if (config.fgType === 'gradient') {
          gradientOptions.classList.remove('hidden');
          secondaryColor.classList.remove('hidden');
        } else {
          gradientOptions.classList.add('hidden');
          secondaryColor.classList.add('hidden');
        }
      }
    }

    if (config.primaryColor) {
      document.getElementById('color-dots-primary').value = config.primaryColor;
      document.getElementById('color-dots-primary-text').value = config.primaryColor.toUpperCase();
    }
    if (config.secondaryColor) {
      document.getElementById('color-dots-secondary').value = config.secondaryColor;
      document.getElementById('color-dots-secondary-text').value = config.secondaryColor.toUpperCase();
    }
    if (config.gradientType) document.getElementById('select-gradient-type').value = config.gradientType;
    if (config.gradientRotation !== undefined) {
      document.getElementById('range-gradient-rotation').value = config.gradientRotation;
      document.getElementById('val-gradient-rotation').textContent = config.gradientRotation + '°';
    }

    // 3. Custom Corners setup
    if (config.hasCustomCorners !== undefined) {
      const toggle = document.getElementById('toggle-custom-corners');
      toggle.checked = config.hasCustomCorners;
      const cornersPanel = document.getElementById('row-corners-colors');
      if (config.hasCustomCorners) {
        cornersPanel.classList.remove('hidden');
      } else {
        cornersPanel.classList.add('hidden');
      }
    }
    if (config.cornerOuterColor) {
      document.getElementById('color-corner-outer').value = config.cornerOuterColor;
      document.getElementById('color-corner-outer-text').value = config.cornerOuterColor.toUpperCase();
    }
    if (config.cornerInnerColor) {
      document.getElementById('color-corner-inner').value = config.cornerInnerColor;
      document.getElementById('color-corner-inner-text').value = config.cornerInnerColor.toUpperCase();
    }

    // 4. Background Setup
    if (config.isTransparent !== undefined) {
      const toggle = document.getElementById('toggle-bg-transparent');
      toggle.checked = config.isTransparent;
      const bgPickerWrapper = document.getElementById('color-bg').closest('.color-picker-item');
      if (config.isTransparent) {
        bgPickerWrapper.style.opacity = '0.3';
        bgPickerWrapper.style.pointerEvents = 'none';
      } else {
        bgPickerWrapper.style.opacity = '1';
        bgPickerWrapper.style.pointerEvents = 'auto';
      }
    }
    if (config.bgColor) {
      document.getElementById('color-bg').value = config.bgColor;
      document.getElementById('color-bg-text').value = config.bgColor.toUpperCase();
    }

    // 5. Logo / Icon state synchronization
    const dropzone = document.getElementById('logo-dropzone');
    const logoControls = document.getElementById('logo-active-controls');
    
    if (config.activePreset) {
      activePreset = config.activePreset;
      document.querySelector('.preset-btn.active')?.classList.remove('active');
      const btn = document.querySelector(`.preset-btn[data-preset="${activePreset}"]`);
      if (btn) btn.classList.add('active');

      if (activePreset === 'custom') {
        if (config.uploadedLogoDataUrl) {
          uploadedLogoDataUrl = config.uploadedLogoDataUrl;
          uploadedLogoName = config.uploadedLogoName || 'imported_logo.png';
          
          dropzone.classList.add('hidden');
          logoControls.classList.remove('hidden');
          document.getElementById('img-logo-preview').src = uploadedLogoDataUrl;
          document.getElementById('lbl-logo-name').textContent = uploadedLogoName;
        } else {
          activePreset = 'none';
          document.querySelector('.preset-btn.active')?.classList.remove('active');
          document.querySelector('.preset-btn[data-preset="none"]').classList.add('active');
          logoControls.classList.add('hidden');
          dropzone.classList.remove('hidden');
        }
      } else if (activePreset === 'none') {
        logoControls.classList.add('hidden');
        dropzone.classList.remove('hidden');
        uploadedLogoDataUrl = null;
      } else {
        // Preset logo
        logoControls.classList.add('hidden');
        dropzone.classList.remove('hidden');
      }
    }

    if (config.logoScale !== undefined) {
      document.getElementById('range-logo-size').value = config.logoScale;
      document.getElementById('val-logo-size').textContent = config.logoScale + '%';
    }
    if (config.hasLogoBg !== undefined) {
      document.getElementById('toggle-logo-bg').checked = config.hasLogoBg;
    }

    // 6. Update visual representation of QR
    updateQR();
    triggerGlowEffect();
  } catch (err) {
    alert((TRANSLATIONS[currentLang]['alertImportFail'] || 'Failed to apply imported configuration: ') + err.message);
  }
}

// 6. QR Code Styling & Render Logic

// Initial setup of QR
function initQR() {
  const options = getQRStylingOptions();
  
  // Create object
  qrCode = new QRCodeStyling(options);
  
  // Mount element
  const container = document.getElementById('canvas-container');
  container.innerHTML = '';
  qrCode.append(container);
}

// Read options from DOM inputs
function getQRStylingOptions() {
  const data = getQRData();
  const margin = parseInt(document.getElementById('range-margin').value, 10);
  const ecLevel = document.getElementById('select-ec-level').value;
  
  // Dot Style mapping
  const dotStyle = document.getElementById('select-dot-style').value;
  
  // Corner styles
  const cornerOuter = document.getElementById('select-corner-outer').value;
  const cornerInner = document.getElementById('select-corner-inner').value;
  
  // Colors & Gradients options
  const isGradient = document.querySelector('input[name="fg-type"]:checked').value === 'gradient';
  const primaryColor = document.getElementById('color-dots-primary').value;
  const secondaryColor = document.getElementById('color-dots-secondary').value;
  const gradientType = document.getElementById('select-gradient-type').value;
  const gradientRotation = parseInt(document.getElementById('range-gradient-rotation').value, 10);
  
  // Custom Corners Colors Option
  const hasCustomCorners = document.getElementById('toggle-custom-corners').checked;
  const cornerOuterColor = document.getElementById('color-corner-outer').value;
  const cornerInnerColor = document.getElementById('color-corner-inner').value;
  
  // Background configuration
  const isTransparent = document.getElementById('toggle-bg-transparent').checked;
  const bgColor = isTransparent ? 'transparent' : document.getElementById('color-bg').value;

  // Logo selection
  let logo = null;
  if (activePreset === 'custom') {
    logo = uploadedLogoDataUrl;
  } else if (activePreset !== 'none') {
    logo = PRESET_LOGOS[activePreset];
  }
  
  const logoScale = parseFloat(document.getElementById('range-logo-size').value) / 100;
  const hasLogoBg = document.getElementById('toggle-logo-bg').checked;
  
  // Structure primary option blocks
  const dotsOptions = {
    type: dotStyle
  };

  if (isGradient) {
    dotsOptions.gradient = {
      type: gradientType,
      rotation: (gradientRotation * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: primaryColor },
        { offset: 1, color: secondaryColor }
      ]
    };
  } else {
    dotsOptions.color = primaryColor;
  }

  // Corners outer options
  const cornersSquareOptions = {
    type: cornerOuter
  };
  if (hasCustomCorners) {
    cornersSquareOptions.color = cornerOuterColor;
  } else {
    cornersSquareOptions.color = primaryColor;
  }

  // Corners inner options
  const cornersDotOptions = {
    type: cornerInner
  };
  if (hasCustomCorners) {
    cornersDotOptions.color = cornerInnerColor;
  } else {
    cornersDotOptions.color = primaryColor;
  }

  return {
    width: 280,
    height: 280,
    type: 'canvas',
    data: data,
    margin: margin,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: ecLevel
    },
    backgroundOptions: {
      color: bgColor
    },
    dotsOptions: dotsOptions,
    cornersSquareOptions: cornersSquareOptions,
    cornersDotOptions: cornersDotOptions,
    image: logo,
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: logoScale,
      margin: hasLogoBg ? 6 : 0
    }
  };
}

// Re-compile options and draw updates
function updateQR() {
  if (!qrCode) return;
  const newOptions = getQRStylingOptions();
  qrCode.update(newOptions);
}

// ================================================================
// Mobile FAB: Scroll-to-QR and Open Scanner
// ================================================================
function setupMobileFABs() {
  // Scroll-to-QR button
  const fabQR = document.getElementById('btn-fab-qr');
  if (fabQR) {
    fabQR.addEventListener('click', () => {
      const previewPanel = document.querySelector('.preview-panel');
      if (previewPanel) {
        previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Scan button opens the scanner modal
  const fabScan = document.getElementById('btn-fab-scan');
  if (fabScan) {
    fabScan.addEventListener('click', () => {
      openScannerModal();
    });
  }

  // Desktop/Sidebar Scan button opens the scanner modal
  const btnScan = document.getElementById('btn-scan-qr');
  if (btnScan) {
    btnScan.addEventListener('click', () => {
      openScannerModal();
    });
  }
}

// ================================================================
// Camera QR Scanner (html5-qrcode)
// ================================================================
let html5QrScanner = null;

async function openScannerModal() {
  const modal = document.getElementById('scanner-modal');
  const resultBanner = document.getElementById('scanner-result-banner');
  const resultText = document.getElementById('scanner-result-text');

  // Reset state
  resultBanner.style.display = 'none';
  resultText.textContent = '';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Dynamically import html5-qrcode to avoid loading on desktop until needed
  try {
    const { Html5Qrcode } = await import('html5-qrcode');

    html5QrScanner = new Html5Qrcode('qr-scanner-viewport');

    const onSuccess = (decodedText) => {
      // Flash result banner
      const successMsg = TRANSLATIONS[currentLang]['scanSuccessMsg'] || 'QR code detected!';
      resultText.textContent = `${successMsg} → ${decodedText}`;
      resultBanner.style.display = 'flex';

      // Stop scanner
      html5QrScanner.stop().catch(() => {});

      // Populate fields: detect if URL or plain text
      const isUrl = /^https?:\/\//i.test(decodedText) || /^www\./i.test(decodedText);

      if (isUrl) {
        // Switch to URL tab
        const urlTabBtn = document.querySelector('.tab-btn[data-tab="url"]');
        if (urlTabBtn && !urlTabBtn.classList.contains('active')) urlTabBtn.click();
        const urlInput = document.getElementById('input-url');
        if (urlInput) {
          urlInput.value = decodedText.replace(/^https?:\/\//i, '');
        }
      } else {
        // Switch to Text tab
        const textTabBtn = document.querySelector('.tab-btn[data-tab="text"]');
        if (textTabBtn && !textTabBtn.classList.contains('active')) textTabBtn.click();
        const textInput = document.getElementById('input-text');
        if (textInput) {
          textInput.value = decodedText;
        }
      }
      updateQR();

      // Close modal after short delay so user sees the result
      setTimeout(() => {
        closeScannerModal();
      }, 2200);
    };

    const onError = () => { /* ignore per-frame errors */ };

    await html5QrScanner.start(
      { facingMode: 'environment' },
      { fps: 12, qrbox: { width: 220, height: 220 } },
      onSuccess,
      onError
    );
  } catch (err) {
    const resultBannerEl = document.getElementById('scanner-result-banner');
    resultBannerEl.style.background = 'rgba(239, 68, 68, 0.08)';
    resultBannerEl.style.borderColor = 'rgba(239, 68, 68, 0.25)';
    resultBannerEl.style.color = '#ef4444';
    document.getElementById('scanner-result-text').textContent =
      'Camera not available. Please allow camera access.';
    resultBannerEl.style.display = 'flex';
  }
}

function closeScannerModal() {
  const modal = document.getElementById('scanner-modal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
  if (html5QrScanner) {
    html5QrScanner.stop().catch(() => {});
    html5QrScanner = null;
  }
}

function setupQRScanner() {
  const closeBtn = document.getElementById('btn-close-scanner');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeScannerModal);
  }

  // Close on backdrop click
  const modal = document.getElementById('scanner-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeScannerModal();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
      closeScannerModal();
    }
  });
}
