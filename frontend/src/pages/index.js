import Link from 'next/link'
import PixelBlast from '@/components/PixelBlast'
import styles from '@/components/PixelBlast.module.css'

export default function Landing() {
  return (
    <div style={{position:'relative', width:'100%', height:'100vh', overflow:'hidden'}}>
      <PixelBlast
        variant="circle"
        pixelSize={6}
        color="#58a6ff"
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={0.6}
        edgeFade={0.25}
        transparent
      />

      <div className={styles.landingForeground}>
  <h1 className={styles.landingHero} style={{fontSize: '160px', margin:0}}>BUG<br/>HUNTER</h1>
        <div className={styles.landingCta}>
          <Link href="/login" className="gh-btn cta-large">Get started — Sign in</Link>
        </div>
      </div>
    </div>
  )
}
