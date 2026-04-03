import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.wpctech.info',
  integrations: [
    starlight({
      title: 'Guest Documentation',
      description: 'The Westminster Presbyterian Church Guest Technology Documentation is a reference guide for guests using the technology in Mackey Hall.',
      logo: {
        src: './src/assets/WPC_logo.png',
        alt: 'Westminster Presbyterian Church',
      },
      favicon: '/assets/WPC_logo.png',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/westminsterwooster/wpc-tech-docs-guest' },
        { icon: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/wpcwooster' },
        { icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/wpc_wooster' },
        { icon: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/westminsterwooster' },
        { icon: 'email', label: 'Email', href: 'mailto:jack@wpcwooster.org' },
        { icon: 'external', label: 'Website', href: 'https://wpcwooster.org' },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'About', link: '/about/' },
        {
          label: 'Documentation',
          items: [
            { label: 'Overview', link: '/documentation/' },
            {
              label: 'Video',
              items: [
                { label: 'Lowering Projector Screen', link: '/documentation/video/lowering_screen/' },
                { label: 'Retracting Projector Screen', link: '/documentation/video/retracting_screen/' },
                { label: 'Turning Projector / Rear TV On', link: '/documentation/video/turning_projector_on/' },
                { label: 'Turning Projector / Rear TV Off', link: '/documentation/video/turning_projector_off/' },
                { label: 'Input Methods', link: '/documentation/video/inputs/' },
              ],
            },
            {
              label: 'Audio',
              items: [
                { label: 'Turning Sound System On', link: '/documentation/audio/turning_sound_system_on/' },
                { label: 'Using Wall Audio Controls', link: '/documentation/audio/wall_audio_controls/' },
                { label: 'Using Computer Audio', link: '/documentation/audio/computer_audio/' },
                { label: 'Bluetooth Pairing', link: '/documentation/audio/bluetooth_pairing/' },
                { label: 'Connecting and Using Microphones', link: '/documentation/audio/microphones/' },
              ],
            },
            {
              label: 'Troubleshooting',
              items: [
                { label: 'Coming Soon', link: '/comingsoon/' },
              ],
            },
          ],
        },
        {
          label: 'Print / Download PDF',
          link: '/print/',
          attrs: { target: '_blank' },
        },
      ],
    }),
  ],
});
