import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet,
  Dimensions, Animated, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { reviewsApi } from '../api/reviewsApi';

const { width } = Dimensions.get('window');

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  brand:    '#FF6B35',
  dark:     '#1A1A2E',
  bg:       '#F7F8FA',
  card:     '#FFFFFF',
  border:   '#EDEEF2',
  textPrimary:   '#1A1A2E',
  textSecondary: '#8A8FA8',
  textMuted:     '#B5B9CC',
  green:    '#00B14F',
}

const SERVICES = [
  {
    title: 'Cafe & Boissons',
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
    desc: 'Medicaments & soins',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
  },
];

const STEPS = [
  { n: '01', title: 'Choisissez', desc: 'Parcourez le catalogue et selectionnez vos articles.' },
  { n: '02', title: 'Commandez', desc: 'Indiquez votre adresse et confirmez en un clic.' },
  { n: '03', title: 'Suivez', desc: 'Regardez votre livreur arriver sur la carte en direct.' },
  { n: '04', title: 'Recevez', desc: 'Paiement a la livraison. Simple et sans stress.' },
];

const AVATAR_COLORS = [C.dark, '#C0392B', '#1A5276', '#1D6A3A', '#6F4E37', '#7B2D8B'];

function getInitials(name) {
  if (!name || name === 'Client anonyme') return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recemment';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "A l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `Il y a ${Math.floor(diff / 86400)}j`;
  return `Il y a ${Math.floor(diff / 2592000)} mois`;
}

function Stars({ rating, size = 16 }) {
  const r = Math.round(rating || 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= r ? '#F59E0B' : C.border }}>★</Text>
      ))}
    </View>
  );
}

export default function LandingPage() {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY  = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewsApi.getAllReviews(),
        reviewsApi.getReviewsStats(),
      ]);
      setStats(statsData);
      const seen = new Set();
      const unique = (reviewsData || []).filter(r => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      setReviews(unique);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp',
  });

  const maxDist = Math.max(...Object.values(stats.distribution), 1);

  return (
    <View style={styles.container}>

      {/* Floating header */}
      <Animated.View style={[styles.header, { backgroundColor: `rgba(247,248,250,${headerOpacity})` }]}>
        <View style={styles.headerContent}>
          <View style={styles.logo}>
            <View style={styles.logoIcon}><View style={styles.logoIconDot} /></View>
            <Text style={styles.logoText}>DelivTrack</Text>
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Connexion</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={{ opacity: fadeAnim }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[C.brand]} />
        }
      >

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Disponible a Marrakech</Text>
          </View>
          <Text style={styles.heroTitle}>
            Livraison rapide,{' '}
            <Text style={styles.heroAccent}>suivi en direct.</Text>
          </Text>
          <Text style={styles.heroSub}>
            Cafe, restaurants, pharmacie, shopping — tout ce dont vous avez besoin, livre chez vous en moins de 30 minutes.
          </Text>
          <View style={styles.heroBtns}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.btnPrimaryTxt}>Commander maintenant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnSecondaryTxt}>Se connecter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.features}>
            {['Livraison 30 min', 'Suivi GPS live', 'Paiement a la livraison'].map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureLabel}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <View style={styles.statsSection}>
          {[
            { val: `${stats.total > 0 ? stats.total : '0'}+`, label: 'Commandes livrees' },
            { val: `${stats.total > 0 ? Math.round((stats.average / 5) * 100) : 98}%`, label: 'Clients satisfaits' },
            { val: '25 min', label: 'Delai moyen' },
            { val: `${stats.average > 0 ? stats.average.toFixed(1) : '4.8'}/5`, label: 'Note moyenne' },
          ].map((item, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{item.val}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Services ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.tag}><Text style={styles.tagTxt}>NOS SERVICES</Text></View>
            <Text style={styles.sectionTitle}>Tout ce que vous aimez,{'\n'}livre a votre porte</Text>
            <Text style={styles.sectionSub}>4 categories, des dizaines d'articles, une seule application.</Text>
          </View>
          <View style={styles.servicesGrid}>
            {SERVICES.map((svc, i) => (
              <TouchableOpacity key={i} style={styles.serviceCard} activeOpacity={0.9}>
                <Image source={{ uri: svc.img, cache: 'force-cache' }} style={styles.serviceImg} />
                <LinearGradient
                  colors={['transparent', 'rgba(26,26,46,0.85)']}
                  style={styles.serviceOverlay}
                />
                <View style={styles.serviceText}>
                  <Text style={styles.serviceTitle}>{svc.title}</Text>
                  <Text style={styles.serviceDesc}>{svc.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <View style={[styles.section, styles.howSection]}>
          <View style={styles.sectionHeader}>
            <View style={styles.tag}><Text style={styles.tagTxt}>COMMENT CA MARCHE</Text></View>
            <Text style={styles.sectionTitle}>4 etapes, c'est tout.</Text>
          </View>
          <View style={styles.stepsContainer}>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberTxt}>{step.n}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.btnPrimaryTxt}>Essayer gratuitement</Text>
          </TouchableOpacity>
        </View>

        {/* ── Reviews ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.tag}><Text style={styles.tagTxt}>AVIS CLIENTS</Text></View>
            <Text style={styles.sectionTitle}>Ce que disent nos clients</Text>
          </View>

          {/* Rating widget */}
          <View style={styles.ratingWidget}>
            <View style={styles.ratingLeft}>
              <Text style={styles.ratingScore}>
                {stats.average > 0 ? stats.average.toFixed(1) : '4.8'}
              </Text>
              <Stars rating={stats.average || 4.8} size={14} />
              <Text style={styles.ratingCount}>
                {stats.total > 0 ? `${stats.total} avis verifies` : 'Aucun avis'}
              </Text>
            </View>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map(n => (
                <View key={n} style={styles.barRow}>
                  <Text style={styles.barLabel}>{n}</Text>
                  <View style={styles.barBg}>
                    <View style={[
                      styles.barFill,
                      { width: `${stats.total > 0 ? (stats.distribution[n] / maxDist) * 100 : 0}%` }
                    ]} />
                  </View>
                  <Text style={styles.barCount}>{stats.distribution[n] || 0}</Text>
                </View>
              ))}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={C.brand} style={{ marginTop: 40 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <View style={styles.emptyCircle} />
              <Text style={styles.emptyTitle}>Aucun avis pour le moment</Text>
              <Text style={styles.emptyText}>Les avis apparaitront ici apres les premieres livraisons.</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.btnPrimaryTxt}>Commander maintenant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={reviews}
              keyExtractor={(item, index) => `review-${item.id?.toString() || index}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.clientName || 'Client') }]}>
                      <Text style={styles.avatarTxt}>{getInitials(item.clientName)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{item.clientName || 'Client'}</Text>
                      <Text style={styles.reviewCity}>{item.city || 'Marrakech'}</Text>
                    </View>
                    <Text style={styles.reviewDate}>{timeAgo(item.date || item.createdAt)}</Text>
                  </View>
                  <Stars rating={item.rating || 5} size={13} />
                  <Text style={styles.reviewComment}>
                    "{item.comment || item.ratingComment || 'Service excellent !'}"
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <View style={styles.verifiedDot} />
                    <Text style={styles.verifiedTxt}>Commande verifiee</Text>
                  </View>
                </View>
              )}
              contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}
            />
          )}
        </View>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <LinearGradient colors={[C.dark, '#0F0F1E']} style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Pret a commander ?</Text>
          <Text style={styles.ctaSub}>
            Rejoignez des milliers de clients satisfaits a Marrakech. Inscription gratuite, livraison en 30 minutes.
          </Text>
          <View style={styles.ctaBtns}>
            <TouchableOpacity style={styles.ctaBtnLight} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.ctaBtnLightTxt}>Creer un compte gratuit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaBtnOutline} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.ctaBtnOutlineTxt}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLogo}>
              <View style={styles.footerLogoIcon}><View style={styles.footerLogoDot} /></View>
              <Text style={styles.footerLogoTxt}>DelivTrack</Text>
            </View>
            <Text style={styles.copyright}>© 2025 DelivTrack</Text>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon:      {
    width: 32, height: 32, backgroundColor: C.brand,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  logoIconDot:   { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.9)' },
  logoText:      { fontSize: 18, fontWeight: '800', color: C.dark },
  loginBtn:      { paddingVertical: 9, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1.5, borderColor: C.border },
  loginBtnText:  { fontSize: 14, fontWeight: '600', color: C.dark },

  // Hero
  hero: { padding: 24, paddingTop: 120 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#E8FBF0',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, alignSelf: 'flex-start', marginBottom: 18,
  },
  badgeDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#1D6A3A' },
  heroTitle: { fontSize: 38, fontWeight: '900', lineHeight: 44, color: C.dark, marginBottom: 14, letterSpacing: -1 },
  heroAccent:{ color: C.brand },
  heroSub:   { fontSize: 15, color: C.textSecondary, lineHeight: 23, marginBottom: 24 },
  heroBtns:  { flexDirection: 'row', gap: 12, marginBottom: 24 },

  btnPrimary: {
    backgroundColor: C.brand, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 24,
    flex: 1, alignItems: 'center',
  },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnSecondary: {
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: C.border,
    flex: 1, alignItems: 'center',
    backgroundColor: C.card,
  },
  btnSecondaryTxt: { fontSize: 15, fontWeight: '600', color: C.dark },

  features:     { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  featureItem:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: C.brand },
  featureLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },

  // Stats
  statsSection: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: C.dark,
    paddingVertical: 36, paddingHorizontal: 16,
    marginVertical: 20,
  },
  statItem:  { alignItems: 'center', minWidth: 80 },
  statValue: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: '600' },

  // Section
  section:       { padding: 24 },
  sectionHeader: { alignItems: 'center', marginBottom: 28 },
  tag:           {
    backgroundColor: '#F0F1F8',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, marginBottom: 14,
  },
  tagTxt:      { fontSize: 10, fontWeight: '800', color: C.textSecondary, letterSpacing: 1 },
  sectionTitle:{ fontSize: 30, fontWeight: '900', textAlign: 'center', color: C.dark, marginBottom: 10, letterSpacing: -0.5 },
  sectionSub:  { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Services
  servicesGrid: { gap: 14 },
  serviceCard:  { height: 180, borderRadius: 20, overflow: 'hidden' },
  serviceImg:   { width: '100%', height: '100%' },
  serviceOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 },
  serviceText:  { position: 'absolute', bottom: 16, left: 16, right: 16 },
  serviceTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  serviceDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // How it works
  howSection:      { backgroundColor: '#F0F1F8', marginVertical: 10 },
  stepsContainer:  { gap: 22, marginBottom: 32 },
  stepItem:        { alignItems: 'center' },
  stepNumber:      {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  stepNumberTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },
  stepTitle:       { fontSize: 17, fontWeight: '800', color: C.dark, marginBottom: 5 },
  stepDesc:        { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },

  // Rating widget
  ratingWidget: {
    flexDirection: 'row', backgroundColor: C.card,
    borderRadius: 20, padding: 20, marginBottom: 24, gap: 20,
    borderWidth: 1, borderColor: C.border,
  },
  ratingLeft:  { alignItems: 'center', minWidth: 90 },
  ratingScore: { fontSize: 46, fontWeight: '900', color: C.dark, letterSpacing: -2 },
  ratingCount: { fontSize: 11, color: C.textSecondary, marginTop: 6, textAlign: 'center' },
  ratingBars:  { flex: 1, gap: 8 },
  barRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel:    { width: 16, fontSize: 11, color: C.textSecondary, fontWeight: '700' },
  barBg:       { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  barCount:    { width: 22, fontSize: 10, color: C.textMuted, textAlign: 'right' },

  // Reviews
  reviewCard: {
    width: 270, backgroundColor: C.card,
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: C.border,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 13, fontWeight: '700', color: '#fff' },
  reviewName:   { fontSize: 13, fontWeight: '700', color: C.dark, flex: 1 },
  reviewCity:   { fontSize: 11, color: C.textSecondary },
  reviewDate:   { fontSize: 10, color: C.textMuted },
  reviewComment:{ fontSize: 13, color: C.textSecondary, lineHeight: 19, marginVertical: 8, fontStyle: 'italic' },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  verifiedDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  verifiedTxt:  { fontSize: 11, color: C.textSecondary, fontWeight: '600' },

  // Empty reviews
  emptyReviews: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyCircle:  { width: 64, height: 64, borderRadius: 32, backgroundColor: C.border },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: C.dark },
  emptyText:    { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 24 },

  // CTA
  ctaSection: { padding: 40, alignItems: 'center', marginVertical: 16 },
  ctaTitle:   { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  ctaSub:     { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  ctaBtns:    { gap: 12, width: '100%' },
  ctaBtnLight: { backgroundColor: C.brand, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  ctaBtnLightTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  ctaBtnOutline: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  ctaBtnOutlineTxt: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  // Footer
  footer:        { padding: 20, borderTopWidth: 1, borderTopColor: C.border },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLogo:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLogoIcon:{ width: 26, height: 26, backgroundColor: C.brand, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  footerLogoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.9)' },
  footerLogoTxt: { fontSize: 14, fontWeight: '800', color: C.dark },
  copyright:     { fontSize: 11, color: C.textSecondary },
});