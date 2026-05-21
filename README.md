# 🌀 QRGo — Premium Custom QR Code Generator

<div align="center">

[![Vite](https://img.shields.io/badge/Vite-5.4.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.3.x-F9F9F9?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-204ECF?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![HTML5 Qrcode](https://img.shields.io/badge/HTML5_QR_Scanner-teal?style=for-the-badge&logo=qrcode&logoColor=white)](https://github.com/mebjas/html5-qrcode)

**An elegant, high-fidelity custom QR Code generator built 100% client-side. Fast, beautiful, and private.**
<br />
*Um gerador de QR Code premium, elegante e de alta fidelidade desenvolvido 100% no lado do cliente.*

[English](#-english-documentation) • [Português](#-documentação-em-português)

</div>

---

## 🇺🇸 English Documentation

**QRGo** is a professional-grade custom QR Code creation suite built with modern design principles. It features vibrant gradients, custom dot patterns, scalable eye-frames, logo overlays, and a dynamic real-time preview canvas. To maximize utility, **QRGo** also includes a fully integrated camera scanner to decode, replicate, and edit pre-existing QR codes instantly.

Designed with light-mode glassmorphism and smooth micro-animations, the entire app runs completely client-side in the browser, ensuring absolute privacy for your personal credentials and SSID passwords.

### ✨ Key Features

- **🌐 Multilingual Setup**: Complete localization in **English (EN)**, **Portuguese (PT-BR)**, and **Spanish (ES)** with automatic browser locale detection and persistent manual override selector.
- **🎨 Highly Customizable Shapes**:
  - Choose between multiple dot patterns: Rounded, Dots, Classy, Fluid Classy, Extra Bulky Rounded, and Classic Square.
  - Set custom frames for corner outer eyes and corner inner cores.
  - Fully adjustable quiet zone margins.
- **🌈 Vibrant Colors & Gradients**:
  - Support for Solid Colors or Linear/Radial gradients.
  - Separate customization for inner and outer corner colors.
  - Optional fully transparent background grids.
- **🖼️ Logo & Preset Overlays**:
  - One-click presets for WhatsApp, Instagram, Wi-Fi, Web/Globe, Email, and GitHub.
  - Secure drag-and-drop custom logo image uploader (supports PNG, JPG, SVG up to 2MB).
  - White-margin logo shielding and scale controls.
- **⚙️ Save & Import Style Presets**: Export your layout and color styles to a `.json` configuration file, ready to be imported back in one click next time.
- **📷 Camera QR Scanner**: Dynamic camera feed viewport that scans any QR code and automatically loads its parameters into corresponding inputs. Available on both mobile floating triggers and desktop.
- **⚡ 100% Responsive Design**: Visual order optimized for mobile (Live QR Preview displays first at the top), fluid input grids, and modern bottom safe-area anchor offsets.
- **🔍 Google SEO Ready**: Fully semantic HTML elements with dynamic Open Graph tags, language headers, page titles, and description tags mapping on language changes.

---

### 📂 Codebase Structure

The project maintains a clean, hyper-optimized structure with zero heavy framework bloat:

- `index.html`: Holds the SEO metadata, responsive page containers, structural modal frameworks, and dynamic language keys (`data-i18n`).
- `style.css`: Powers custom variables, light corporate color templates, keyframe animations, sticky scroll panels, and safe-area adjustments.
- `main.js`: Drives translation dictionary handlers, real-time input synchronization, dynamic camera feeds (`html5-qrcode`), and custom styling renders (`qr-code-styling`).
- `vite.config.js`: Bundles assets, optimizes build code, and minifies scripts for production.
- `public/`: Stores static assets including presets (`whatsapp.png`, `instagram.png`) and deployment scripts.

---

### 💻 Local Setup & Development

Make sure you have [Bun](https://bun.sh) (recommended) or [NodeJS](https://nodejs.org) installed on your system.

#### 1. Install Dependencies
```bash
bun install
# or: npm install
```

#### 2. Run Development Server
```bash
bun run dev
# or: npm run dev
```
Open `http://localhost:5173` in your browser.

#### 3. Compile for Production
```bash
bun run build
# or: npm run build
```
The optimized bundle will be generated in the `/dist` directory.

---

### ☁️ Cloudflare Pages Deployment

Deploy the project instantly to Cloudflare Pages using Wrangler:

```bash
bun run deploy-dev
# or: npm run deploy-dev
```

---

## 🇧🇷 Documentação em Português

O **QRGo** é uma suíte de criação de códigos QR customizados de nível profissional, desenvolvida sob princípios de design moderno. Conta com degradês sofisticados, padrões de pontos exclusivos, molduras de cantos customizáveis, sobreposições de logótipos e uma tela de visualização em tempo real de alta fidelidade. O **QRGo** também inclui um leitor de câmara totalmente integrado para ler, replicar e editar códigos QR existentes na hora.

Tudo é executado de forma 100% cliente-side (diretamente no navegador), garantindo privacidade total para as suas credenciais pessoais e palavras-passe de redes sem fio.

### ✨ Funcionalidades Principais

- **🌐 Suporte Multilingue**: Tradução e localização nativa completa para **Inglês (EN)**, **Português (PT-BR)** e **Espanhol (ES)** com deteção automática baseada no navegador e seletor manual.
- **🎨 Formatos Personalizáveis**:
  - Múltiplos padrões de pontos: Arredondado Suave, Pontos Circulares, Arredondado Elegante, Fluido Elegante, Super Arredondado e Quadrado Clássico.
  - Personalização de molduras exteriores e núcleos interiores dos cantos.
  - Controlo preciso da margem de zona silenciosa.
- **🌈 Cores & Degradês**:
  - Opções de Cor Sólida ou Gradientes Lineares/Radiais com rotação de ângulo ajustável.
  - Definição independente de cores para os cantos internos e externos.
  - Tela de fundo opcional 100% transparente.
- **🖼️ Ícones & Presets Incorporados**:
  - Atalhos prontos para WhatsApp, Instagram, Wi-Fi, Globe/Web, E-mail e GitHub.
  - Upload intuitivo via arrastar-e-soltar de logótipos personalizados (PNG, JPG, SVG de até 2MB).
  - Controlo de escala do logo e escudo de proteção branco.
- **⚙️ Exportação & Importação de Configuração**: Guarde as suas preferências de design num ficheiro `.json` local para reimportar e reutilizar as suas cores e formas instantaneamente em futuros QR codes.
- **📷 Leitor de QR Code Integrado**: Permite acionar a câmara (telemóvel ou webcam do computador) para escanear um código QR e carregar automaticamente as informações nas caixas de texto.
- **⚡ Layout 100% Responsivo**: Layout priorizado para mobile (a visualização do QR Code aparece primeiro no topo da página), formulários fluidos e ajuste de botões flutuantes adaptados à área segura de ecrãs modernos.

---

### 💻 Como Executar Localmente

Garanta que possui o [Bun](https://bun.sh) (recomendado) ou o [NodeJS](https://nodejs.org) instalado.

#### 1. Instalar Dependências
```bash
bun install
# ou: npm install
```

#### 2. Executar o Servidor de Desenvolvimento
```bash
bun run dev
# ou: npm run dev
```
Abra `http://localhost:5173` no seu browser.

#### 3. Compilar para Produção
```bash
bun run build
# ou: npm run build
```
Os ficheiros minificados de produção estarão disponíveis na pasta `/dist`.

---

## 👨‍💻 Developer & Credits

Designed and developed by **Henrique Silva**.
- 🌐 Website Portfolio: [hfps.dev](https://hfps.dev)
- 💼 LinkedIn: [Henrique Silva](https://www.linkedin.com/in/henriquesilva)

---

<div align="center">
Made with ❤️ by Henrique Silva • © 2026 QRGo
</div>
