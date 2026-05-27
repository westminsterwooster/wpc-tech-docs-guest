import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'index',
    {
      type: 'category',
      label: 'About',
      link: {
        type: 'doc',
        id: 'about'
      },
      items: ['changelog']
    },
    {
      type: 'category',
      label: 'Documentation',
      link: {
        type: 'doc',
        id: 'documentation/index'
      },
      items: [
        {
          type: 'category',
          label: 'Video',
          items: [
            'documentation/video/lowering_screen',
            'documentation/video/retracting_screen',
            'documentation/video/turning_projector_on',
            'documentation/video/turning_projector_off',
            'documentation/video/inputs'
          ]
        },
        {
          type: 'category',
          label: 'Audio',
          items: [
            'documentation/audio/turning_sound_system_on',
            'documentation/audio/wall_audio_controls',
            'documentation/audio/computer_audio',
            'documentation/audio/bluetooth_pairing',
            'documentation/audio/microphones'
          ]
        },
        {
          type: 'category',
          label: 'Troubleshooting',
          items: ['comingsoon']
        }
      ]
    }
  ]
};

export default sidebars;
