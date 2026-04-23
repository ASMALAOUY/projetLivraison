import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'

const SERVICES = [
  {
    title: 'Café & Boissons',
    desc: 'Boissons chaudes & froides',
    img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  },
  {
    title: 'Restaurants',
    desc: 'Plats locaux & internationaux',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  },
  {
    title: 'Shopping & Colis',
    desc: 'Colis, courses & cadeaux',
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
  },
  {
    title: 'Pharmacie',
    desc: 'Médicaments & soins',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  },
]

const STEPS = [
  { n: '01', title: 'Choisissez', desc: 'Parcourez le catalogue et sélectionnez vos articles.' },
  { n: '02', title: 'Commandez',  desc: 'Indiquez votre adresse et confirmez en un clic.' },
  { n: '03', title: 'Suivez',     desc: 'Regardez votre livreur arriver sur la carte en direct.' },
  { n: '04', title: 'Recevez',    desc: 'Paiement à la livraison. Simple et sans stress.' },
]

const STATS_STATIC = [
  { value: '12 000+', label: 'Commandes livrées' },
  { value: '98%',     label: 'Clients satisfaits' },
  { value: '25 min',  label: 'Délai moyen' },
]

const AVATAR_COLORS = ['#1A1A18','#C0392B','#1A5276','#1D6A3A','#6F4E37','#7B2D8B','#B7770D']

function Stars({ n, size = 16 }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:size, color:i<=n?'#F59E0B':'#E5E7EB', lineHeight:1 }}>★</span>
      ))}
    </span>
  )
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)       return "À l'instant"
  if (diff < 3600)     return `Il y a ${Math.floor(diff/60)} min`
  if (diff < 86400)    return `Il y a ${Math.floor(diff/3600)}h`
  if (diff < 2592000)  return `Il y a ${Math.floor(diff/86400)} jour${Math.floor(diff/86400)>1?'s':''}`
  if (diff < 31536000) return `Il y a ${Math.floor(diff/2592000)} mois`
  return `Il y a ${Math.floor(diff/31536000)} an${Math.floor(diff/31536000)>1?'s':''}`
}

function initials(name = '') {
  return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?'
}

function avatarColor(name = '') {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [reviews,  setReviews]  = useState([])
  const [stats,    setStats]    = useState({ average:0, total:0, distribution:{1:0,2:0,3:0,4:0,5:0} })
  const [loadingR, setLoadingR] = useState(true)
  const [page,     setPage]     = useState(1)
  const PER_PAGE = 6

  const [visible, setVisible] = useState({})
  const refsMap = useRef({})

  const setRef = (key) => (el) => { refsMap.current[key] = el }

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.anim]: true }))
      }),
      { threshold: 0.12 }
    )
    Object.values(refsMap.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [reviews, loadingR])

  useEffect(() => {
    Promise.all([
      api.get('/reviews'),
      api.get('/reviews/stats'),
    ]).then(([r1, r2]) => {
      setReviews(r1.data || [])
      setStats(r2.data  || { average:0, total:0, distribution:{1:0,2:0,3:0,4:0,5:0} })
    }).catch(() => {}).finally(() => setLoadingR(false))
  }, [])

  const displayed = reviews.slice(0, page * PER_PAGE)
  const hasMore   = displayed.length < reviews.length
  const dist      = stats.distribution
  const maxDist   = Math.max(...Object.values(dist), 1)

  return (
    <div style={{ fontFamily:"'Sora', sans-serif", background:'#FAFAF8', color:'#1A1A18', overflowX:'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .anim-up{opacity:0}
        .anim-up.vis{animation:fadeUp .55s cubic-bezier(.22,1,.36,1) forwards}
        .btn-p{background:#1A1A18;color:#FAFAF8;border:none;border-radius:14px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s,transform .15s;font-family:inherit;letter-spacing:-.01em}
        .btn-p:hover{background:#333;transform:translateY(-1px)}
        .btn-g{background:transparent;color:#1A1A18;border:1.5px solid #D0D0C8;border-radius:14px;padding:13px 28px;font-size:15px;font-weight:500;cursor:pointer;transition:border-color .2s,background .2s;font-family:inherit}
        .btn-g:hover{border-color:#1A1A18;background:#F0F0EC}
        .card-svc{background:#fff;border-radius:20px;border:1px solid #EBEBE6;padding:28px;transition:transform .2s,box-shadow .2s}
        .card-svc:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.08)}
        .card-rev{background:#fff;border-radius:20px;border:1px solid #EBEBE6;padding:24px;transition:transform .2s,box-shadow .2s;display:flex;flex-direction:column;gap:12px}
        .card-rev:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.07)}
        .nav-a{font-size:14px;font-weight:500;color:#666;text-decoration:none;transition:color .15s}
        .nav-a:hover{color:#1A1A18}
        .tag{display:inline-block;background:#F4F4F0;color:#555;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;letter-spacing:.03em}
        .badge{display:inline-flex;align-items:center;gap:6px;background:#F0F4FF;color:#1A3A8F;border-radius:100px;padding:6px 14px;font-size:12px;font-weight:600}
        .skel{background:linear-gradient(90deg,#F0F0EC 25%,#E8E8E4 50%,#F0F0EC 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:12px}
        .load-btn{width:100%;padding:14px;border-radius:14px;border:1.5px solid #DDD;background:transparent;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;color:#555;transition:border-color .2s,background .2s}
        .load-btn:hover{border-color:#1A1A18;background:#F4F4F0;color:#1A1A18}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'sticky',top:0,zIndex:100,background:'rgba(250,250,248,.93)',backdropFilter:'blur(12px)',borderBottom:'1px solid #EBEBE6',padding:'0 6%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:64 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:32,height:32,background:'#1A1A18',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>🛵</div>
            <span style={{ fontSize:18,fontWeight:800,letterSpacing:'-.03em' }}>DelivTrack</span>
          </div>
          <div style={{ display:'flex',gap:32 }}>
            <a href="#services" className="nav-a">Services</a>
            <a href="#comment"  className="nav-a">Comment ça marche</a>
            <a href="#avis"     className="nav-a">Avis clients</a>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button className="btn-g" style={{ padding:'9px 20px',fontSize:14 }} onClick={()=>navigate('/login')}>Connexion</button>
            <button className="btn-p" style={{ padding:'9px 20px',fontSize:14 }} onClick={()=>navigate('/register')}>S'inscrire</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative',minHeight:'92vh',display:'flex',alignItems:'center',padding:'0 6%',overflow:'hidden' }}>
        <div style={{ position:'absolute',width:600,height:600,background:'rgba(234,220,190,.45)',top:-100,right:-100,borderRadius:'50%',filter:'blur(80px)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',width:400,height:400,background:'rgba(190,220,234,.35)',bottom:-80,left:-60,borderRadius:'50%',filter:'blur(80px)',pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100,margin:'0 auto',width:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center',position:'relative',zIndex:1 }}>
          <div>
            <div className="badge" style={{ marginBottom:24 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'#22C55E',display:'inline-block' }}/>
              Disponible à Marrakech
            </div>
            <h1 style={{ fontSize:'clamp(40px,5vw,68px)',fontWeight:800,lineHeight:1.05,letterSpacing:'-.04em',margin:'0 0 24px' }}>
              Livraison rapide,<br/>
              <span style={{ color:'#C0392B' }}>suivi en direct.</span>
            </h1>
            <p style={{ fontSize:17,color:'#666',lineHeight:1.75,maxWidth:460,margin:'0 0 36px' }}>
              Café, restaurants, pharmacie, shopping — tout ce dont vous avez besoin, livré chez vous en moins de 30 minutes avec suivi GPS en temps réel.
            </p>
            <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:48 }}>
              <button className="btn-p" style={{ fontSize:16,padding:'16px 36px' }} onClick={()=>navigate('/register')}>Commander maintenant</button>
              <button className="btn-g" style={{ fontSize:16 }} onClick={()=>navigate('/login')}>J'ai déjà un compte</button>
            </div>
            <div style={{ display:'flex',gap:24,flexWrap:'wrap' }}>
              {[['⚡','Livraison 30 min'],['📍','Suivi GPS live'],['💳','Paiement à la livraison']].map(([ic,lb])=>(
                <div key={lb} style={{ display:'flex',alignItems:'center',gap:7,fontSize:13,color:'#555',fontWeight:500 }}>
                  <span style={{ fontSize:15 }}>{ic}</span>{lb}
                </div>
              ))}
            </div>
          </div>
          {/* Carte animée */}
          <div style={{ display:'flex',justifyContent:'center',position:'relative' }}>
            <div style={{ width:'100%',maxWidth:380,position:'relative',animation:'float 4s ease-in-out infinite' }}>
              <div style={{ background:'#1A1A18',borderRadius:28,padding:6,boxShadow:'0 32px 80px rgba(0,0,0,.22)' }}>
                <div style={{ background:'#2A2A28',borderRadius:22,overflow:'hidden',height:280,position:'relative' }}>
                  <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,#2A3A4A,#1A2A3A)' }}>
                    {[30,80,130,180,230].map(y=><div key={y} style={{ position:'absolute',left:0,right:0,top:y,height:1,background:'rgba(255,255,255,.06)' }}/>)}
                    {[40,100,160,220,280,340].map(x=><div key={x} style={{ position:'absolute',top:0,bottom:0,left:x,width:1,background:'rgba(255,255,255,.06)' }}/>)}
                    <div style={{ position:'absolute',left:155,top:80,display:'flex',flexDirection:'column',alignItems:'center' }}>
                      <div style={{ background:'#EF4444',width:28,height:28,borderRadius:'50% 50% 50% 0',transform:'rotate(-45deg)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <span style={{ transform:'rotate(45deg)',fontSize:13 }}>🏠</span>
                      </div>
                      <div style={{ width:2,height:10,background:'#EF4444' }}/>
                    </div>
                    <div style={{ position:'absolute',left:220,top:118,fontSize:22,animation:'float 2s ease-in-out infinite' }}>🛵</div>
                    <svg style={{ position:'absolute',inset:0 }} width="100%" height="100%">
                      <path d="M 240 130 Q 200 120 183 100" stroke="#22C55E" strokeWidth="2" strokeDasharray="5 4" fill="none" opacity=".8"/>
                    </svg>
                  </div>
                  <div style={{ position:'absolute',top:12,left:12,background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:10,padding:'5px 10px',display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:'#22C55E',animation:'pulse 1.5s infinite' }}/>
                    <span style={{ fontSize:11,color:'#22C55E',fontWeight:700 }}>Suivi en direct</span>
                  </div>
                </div>
                <div style={{ padding:'16px 14px 10px',display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:'#C0392B',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>🍕</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>Pizza Margherita</div>
                    <div style={{ fontSize:11,color:'#888',marginTop:2 }}>Arrivée estimée : 12 min</div>
                  </div>
                  <div style={{ fontSize:13,fontWeight:700,color:'#22C55E' }}>55 MAD</div>
                </div>
              </div>
              <div style={{ position:'absolute',top:-16,right:-16,background:'#fff',borderRadius:16,padding:'10px 14px',boxShadow:'0 8px 24px rgba(0,0,0,.12)',display:'flex',alignItems:'center',gap:8 }}>
                <Stars n={5} size={14}/>
                <span style={{ fontSize:13,fontWeight:700 }}>{stats.average||'4.8'}</span>
              </div>
              <div style={{ position:'absolute',bottom:-16,left:-16,background:'#fff',borderRadius:16,padding:'10px 14px',boxShadow:'0 8px 24px rgba(0,0,0,.12)',display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ fontSize:18 }}>⚡</span>
                <div>
                  <div style={{ fontSize:11,color:'#888',fontWeight:500 }}>Livraison</div>
                  <div style={{ fontSize:13,fontWeight:700 }}>~25 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding:'60px 6%',background:'#1A1A18' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
          {STATS_STATIC.map((s,i)=>(
            <div key={i} style={{ textAlign:'center',padding:'24px 16px' }}>
              <div style={{ fontSize:'clamp(28px,3vw,42px)',fontWeight:800,color:'#FAFAF8',letterSpacing:'-.03em',lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:13,color:'#888',marginTop:8,fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
          <div style={{ textAlign:'center',padding:'24px 16px' }}>
            <div style={{ fontSize:'clamp(28px,3vw,42px)',fontWeight:800,color:'#FAFAF8',letterSpacing:'-.03em',lineHeight:1 }}>
              {stats.average>0 ? `${stats.average}/5` : '4.8/5'}
            </div>
            <div style={{ fontSize:13,color:'#888',marginTop:8,fontWeight:500 }}>Note moyenne</div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
<section id="services" style={{ padding:'100px 6%' }}>
  <div style={{ maxWidth:1100,margin:'0 auto' }}>
    <div style={{ textAlign:'center',marginBottom:64 }}
      ref={setRef('svc-head')} data-anim="svc-head"
      className={`anim-up${visible['svc-head']?' vis':''}`}
    >
      <div className="tag" style={{ marginBottom:16 }}>NOS SERVICES</div>
      <h2 style={{ fontSize:'clamp(28px,4vw,48px)',fontWeight:800,letterSpacing:'-.03em',margin:'0 0 16px' }}>
        Tout ce que vous aimez,<br/>livré à votre porte
      </h2>
      <p style={{ fontSize:16,color:'#777',maxWidth:480,margin:'0 auto' }}>
        4 catégories, des dizaines d'articles, une seule application.
      </p>
    </div>

    <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16 }}>
      {SERVICES.map((s,i) => (
        <div key={i}
          ref={setRef(`svc${i}`)} data-anim={`svc${i}`}
          style={{
            position:'relative',
            borderRadius:20,
            overflow:'hidden',
            height:240,
            cursor:'pointer',
            opacity: visible[`svc${i}`] ? 1 : 0,
            transform: visible[`svc${i}`] ? 'none' : 'translateY(24px)',
            transition: `opacity .5s ${i*.1}s, transform .5s ${i*.1}s`,
          }}
        >
          {/* Photo de fond */}
          <img
            src={s.img}
            alt={s.title}
            style={{
              position:'absolute', inset:0,
              width:'100%', height:'100%',
              objectFit:'cover',
              transition:'transform .4s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          />
          {/* Gradient overlay */}
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 55%, transparent 100%)',
          }}/>
          {/* Texte */}
          <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'20px 24px' }}>
            <div style={{ fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-.02em',marginBottom:4 }}>
              {s.title}
            </div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,.75)',fontWeight:500 }}>
              {s.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
          
      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="comment" style={{ padding:'100px 6%',background:'#F4F4F0' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:72 }}
            ref={setRef('how')} data-anim="how"
            className={`anim-up${visible['how']?' vis':''}`}
          >
            <div className="tag" style={{ marginBottom:16 }}>COMMENT ÇA MARCHE</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,48px)',fontWeight:800,letterSpacing:'-.03em',margin:0 }}>4 étapes, c'est tout.</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,position:'relative' }}>
            <div style={{ position:'absolute',top:44,left:'12.5%',right:'12.5%',height:1,background:'#DDD',zIndex:0 }}/>
            {STEPS.map((s,i)=>(
              <div key={i}
                ref={setRef(`step${i}`)} data-anim={`step${i}`}
                style={{ position:'relative',zIndex:1,textAlign:'center',opacity:visible[`step${i}`]?1:0,transform:visible[`step${i}`]?'none':'translateY(20px)',transition:`opacity .5s ${i*.12}s,transform .5s ${i*.12}s` }}
              >
                <div style={{ width:56,height:56,borderRadius:'50%',background:'#1A1A18',color:'#FAFAF8',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:15,fontWeight:700 }}>{s.n}</div>
                <div style={{ fontSize:20,fontWeight:700,margin:'0 0 8px',letterSpacing:'-.02em' }}>{s.title}</div>
                <p style={{ fontSize:13,color:'#777',lineHeight:1.7,margin:0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center',marginTop:56 }}>
            <button className="btn-p" style={{ fontSize:16,padding:'16px 40px' }} onClick={()=>navigate('/register')}>Essayer gratuitement</button>
          </div>
        </div>
      </section>

      {/* ── AVIS CLIENTS (vrais, depuis API) ── */}
      <section id="avis" style={{ padding:'100px 6%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>

          {/* En-tête + distribution */}
          <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:56,flexWrap:'wrap',gap:20 }}
            ref={setRef('rev-head')} data-anim="rev-head"
            className={`anim-up${visible['rev-head']?' vis':''}`}
          >
            <div>
              <div className="tag" style={{ marginBottom:16 }}>AVIS CLIENTS</div>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)',fontWeight:800,letterSpacing:'-.03em',margin:'0 0 8px' }}>Ce que disent nos clients</h2>
              <p style={{ fontSize:15,color:'#777',margin:0 }}>
                {stats.total>0 ? `${stats.total} avis vérifiés · note moyenne ${stats.average}/5` : 'Avis vérifiés de vrais clients DelivTrack'}
              </p>
            </div>
            {/* Widget note */}
            <div style={{ background:'#F4F4F0',borderRadius:20,padding:'20px 24px',minWidth:260 }}>
              <div style={{ display:'flex',alignItems:'center',gap:20 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:48,fontWeight:800,letterSpacing:'-.03em',lineHeight:1 }}>
                    {stats.average>0 ? stats.average : '—'}
                  </div>
                  <Stars n={Math.round(stats.average)} size={18}/>
                  <div style={{ fontSize:12,color:'#888',marginTop:6 }}>
                    {stats.total>0 ? `${stats.total} avis` : 'Aucun avis'}
                  </div>
                </div>
                <div style={{ flex:1,display:'flex',flexDirection:'column',gap:6 }}>
                  {[5,4,3,2,1].map(n=>(
                    <div key={n} style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <span style={{ fontSize:11,color:'#888',width:8,flexShrink:0 }}>{n}</span>
                      <div style={{ flex:1,height:5,background:'#E8E8E4',borderRadius:3,overflow:'hidden' }}>
                        <div style={{ height:'100%',background:'#F59E0B',borderRadius:3,width:`${stats.total>0?(dist[n]/maxDist)*100:0}%`,transition:'width .6s ease' }}/>
                      </div>
                      <span style={{ fontSize:11,color:'#BBB',width:20,textAlign:'right',flexShrink:0 }}>{dist[n]||0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grille */}
          {loadingR ? (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18 }}>
              {[...Array(6)].map((_,i)=>(
                <div key={i} style={{ borderRadius:20,border:'1px solid #EBEBE6',padding:24,display:'flex',flexDirection:'column',gap:12 }}>
                  <div style={{ display:'flex',gap:12,alignItems:'center' }}>
                    <div className="skel" style={{ width:42,height:42,borderRadius:'50%' }}/>
                    <div style={{ flex:1,display:'flex',flexDirection:'column',gap:6 }}>
                      <div className="skel" style={{ height:13,width:'60%' }}/>
                      <div className="skel" style={{ height:11,width:'40%' }}/>
                    </div>
                  </div>
                  <div className="skel" style={{ height:11,width:'40%' }}/>
                  <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                    <div className="skel" style={{ height:13,width:'100%' }}/>
                    <div className="skel" style={{ height:13,width:'80%' }}/>
                    <div className="skel" style={{ height:13,width:'65%' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign:'center',padding:'64px 24px',color:'#AAA' }}>
              <div style={{ fontSize:52,marginBottom:16 }}>💬</div>
              <div style={{ fontSize:20,fontWeight:700,marginBottom:10,color:'#555' }}>Aucun avis pour le moment</div>
              <p style={{ fontSize:14,lineHeight:1.75,maxWidth:360,margin:'0 auto 24px' }}>
                Les avis apparaîtront ici après les premières livraisons.<br/>Soyez le premier à commander !
              </p>
              <button className="btn-p" onClick={()=>navigate('/register')}>Commander maintenant</button>
            </div>
          ) : (
            <>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginBottom:28 }}>
                {displayed.map((r,i)=>(
                  <div key={r.id} className="card-rev"
                    ref={setRef(`rev${i}`)} data-anim={`rev${i}`}
                    style={{ opacity:visible[`rev${i}`]?1:0,transform:visible[`rev${i}`]?'none':'translateY(20px)',transition:`opacity .45s ${(i%3)*.08}s,transform .45s ${(i%3)*.08}s` }}
                  >
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ width:42,height:42,borderRadius:'50%',background:avatarColor(r.clientName),display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0 }}>
                        {initials(r.clientName)}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:14,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{r.clientName}</div>
                        <div style={{ fontSize:12,color:'#999' }}>{r.city}</div>
                      </div>
                      <div style={{ fontSize:11,color:'#CCC',flexShrink:0 }}>{timeAgo(r.date)}</div>
                    </div>
                    <Stars n={r.rating} size={15}/>
                    <p style={{ fontSize:14,color:'#555',lineHeight:1.75,margin:0,flex:1 }}>"{r.comment}"</p>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      <span style={{ fontSize:11,color:'#22C55E' }}>✓</span>
                      <span style={{ fontSize:11,color:'#AAA',fontWeight:500 }}>Commande vérifiée</span>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign:'center' }}>
                  <button className="load-btn" onClick={()=>setPage(p=>p+1)}>
                    Voir plus d'avis ({reviews.length - displayed.length} restants)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'80px 6%',background:'#1A1A18',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-80,right:-80,width:400,height:400,borderRadius:'50%',background:'rgba(192,57,43,.15)',filter:'blur(60px)' }}/>
        <div style={{ maxWidth:700,margin:'0 auto',textAlign:'center',position:'relative',zIndex:1 }}>
          <h2 style={{ fontSize:'clamp(28px,4vw,52px)',fontWeight:800,color:'#FAFAF8',letterSpacing:'-.03em',margin:'0 0 20px' }}>Prêt à commander ?</h2>
          <p style={{ fontSize:16,color:'#888',lineHeight:1.75,margin:'0 0 40px' }}>
            Rejoignez des milliers de clients satisfaits à Marrakech. Inscription gratuite, livraison en 30 minutes.
          </p>
          <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
            <button onClick={()=>navigate('/register')}
              style={{ background:'#FAFAF8',color:'#1A1A18',border:'none',borderRadius:14,padding:'16px 40px',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:'inherit',letterSpacing:'-.01em',transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}
            >Créer un compte gratuit</button>
            <button onClick={()=>navigate('/login')}
              style={{ background:'transparent',color:'#FAFAF8',border:'1.5px solid rgba(255,255,255,.25)',borderRadius:14,padding:'15px 32px',fontSize:16,fontWeight:500,cursor:'pointer',fontFamily:'inherit',transition:'border-color .2s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.6)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.25)'}
            >Se connecter</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding:'32px 6%',borderTop:'1px solid #EBEBE6',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:26,height:26,background:'#1A1A18',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>🛵</div>
          <span style={{ fontSize:15,fontWeight:700,letterSpacing:'-.02em' }}>DelivTrack</span>
        </div>
        <span style={{ fontSize:13,color:'#999' }}>© 2025 DelivTrack — ENS Marrakech, Département Informatique</span>
        <div style={{ display:'flex',gap:20 }}>
          <a href="#services" className="nav-a" style={{ fontSize:13 }}>Services</a>
          <a href="#avis"     className="nav-a" style={{ fontSize:13 }}>Avis</a>
          <a href="#comment"  className="nav-a" style={{ fontSize:13 }}>Comment ça marche</a>
        </div>
      </footer>
    </div>
  )
}