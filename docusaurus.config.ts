import type { Config } from "@docusaurus/types";
import type {
  Options as PresetOptions,
  ThemeConfig,
} from "@docusaurus/preset-classic";
import type { Options as DocsOptions } from "@docusaurus/plugin-content-docs";
import type { Options as ThemeOptions } from "@docusaurus/theme-classic";

const docsOptions: DocsOptions = {
  path: "docs",
  routeBasePath: "docs",
  sidebarPath: "./sidebars.ts",
  editUrl:
    "https://github.com/westminsterwooster/wpc-tech-docs-guest/edit/main/",
  showLastUpdateTime: true,
  showLastUpdateAuthor: true,
};

const themeConfig: ThemeConfig = {
  image: "img/WPC_logo.png",
  navbar: {
    title: "Guest Documentation",
    logo: {
      alt: "Westminster Presbyterian Church logo",
      src: "img/WPC_logo.png",
    },
    items: [
      {
        type: "docSidebar",
        sidebarId: "docsSidebar",
        position: "left",
        label: "Docs",
      },
      {
        href: "pathname:///guest-documentation.pdf",
        label: "PDF",
        position: "right",
      },
      {
        href: "https://github.com/westminsterwooster/wpc-tech-docs-guest",
        label: "GitHub",
        position: "right",
      },
    ],
  },
  footer: {
    style: "dark",
    links: [
      {
        title: "Docs",
        items: [
          {
            label: "Documentation",
            to: "/docs/documentation/",
          },
          {
            label: "Printable PDF",
            href: "pathname:///guest-documentation.pdf",
          },
        ],
      },
      {
        title: "Westminster",
        items: [
          {
            label: "Website",
            href: "https://wpcwooster.org",
          },
          {
            label: "Facebook",
            href: "https://www.facebook.com/wpcwooster",
          },
          {
            label: "Instagram",
            href: "https://www.instagram.com/wpc_wooster",
          },
          {
            label: "YouTube",
            href: "https://www.youtube.com/westminsterwooster",
          },
        ],
      },
      {
        title: "Contact",
        items: [
          {
            label: "Email",
            href: "mailto:jack@wpcwooster.org",
          },
        ],
      },
    ],
    copyright:
      "Copyright © 2026 Jack Veney for Westminster Presbyterian Church Wooster, Ohio.",
  },
  prism: {
    theme: require("prism-react-renderer").themes.github,
    darkTheme: require("prism-react-renderer").themes.dracula,
  },
};

const config: Config = {
  title: "Guest Documentation",
  tagline: "Westminster Presbyterian Church Mackey Hall Technology",
  favicon: "img/WPC_logo.png",
  url: "https://docs.wpctech.info",
  baseUrl: "/",
  organizationName: "westminsterwooster",
  projectName: "wpc-tech-docs-guest",
  trailingSlash: false,
  onBrokenLinks: "warn",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  presets: [
    [
      "classic",
      {
        docs: docsOptions,
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        } satisfies ThemeOptions,
      } satisfies PresetOptions,
    ],
  ],
  plugins: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexDocs: true,
        indexPages: true,
        indexBlog: false,
        docsRouteBasePath: "/docs",
      },
    ],
  ],
  themeConfig,
};

export default config;
