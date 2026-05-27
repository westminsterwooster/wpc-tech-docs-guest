import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Guest Documentation"
      description="Westminster Presbyterian Church guest technology documentation for Mackey Hall.">
      <main>
        <section className={styles.hero}>
          <div className={styles.inner}>
            <h1 className={styles.title}>Guest Documentation</h1>
            <p className={styles.subtitle}>
              A clear operating guide for Mackey Hall video, projector, sound,
              computer audio, Bluetooth, and microphone systems.
            </p>
            <div className={styles.actions}>
              <Link className={`${styles.button} ${styles.primary}`} to="/docs/2026.05a/">
                Open Docs
              </Link>
            </div>
          </div>
        </section>
        <section className={styles.below} aria-label="Quick links">
          <div className={styles.quickLinks}>
            <Link className={styles.quickLink} to="/docs/2026.05a/documentation/video/lowering_screen">
              <strong>Video Guides</strong>
              <p>Screen, projector, rear TV, and input instructions.</p>
            </Link>
            <Link className={styles.quickLink} to="/docs/2026.05a/documentation/audio/turning_sound_system_on">
              <strong>Audio Guides</strong>
              <p>Sound system, wall controls, microphones, and Bluetooth.</p>
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
