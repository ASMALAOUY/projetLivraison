import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet,
  Dimensions, Animated, FlatList, ActivityIndicator, RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { reviewsApi } from '../api/reviewsApi';

const { width, height } = Dimensions.get('window');

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
];

const STEPS = [
  { n: '01', title: 'Choisissez', desc: 'Parcourez le catalogue et sélectionnez vos articles.' },
  { n: '02', title: 'Commandez', desc: 'Indiquez votre adresse et confirmez en un clic.' },
  { n: '03', title: 'Suivez', desc: 'Regardez votre livreur arriver sur la carte en direct.' },
  { n: '04', title: 'Recevez', desc: 'Paiement à la livraison. Simple et sans stress.' },
];

const AVATAR_COLORS = ['#1A1A18', '#C0392B', '#1A5276', '#1D6A3A', '#6F4E37', '#7B2D8B', '#B7770D'];

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
  if (!dateStr) return "Récemment";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `Il y a ${Math.floor(diff / 86400)}j`;
  if (diff < 31536000) return `Il y a ${Math.floor(diff / 2592000)} mois`;
  return `Il y a ${Math.floor(diff / 31536000)} an${Math.floor(diff / 31536000) > 1 ? 's' : ''}`;
}

function Stars({ rating, size = 16 }) {
  const roundedRating = Math.round(rating || 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: size, color: i <= roundedRating ? '#F59E0B' : '#E5E7EB' }}>★</Text>
      ))}
    </View>
  );
}

export default function LandingPage() {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Charger les avis et statistiques
  const fetchData = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewsApi.getAllReviews(),
        reviewsApi.getReviewsStats()
      ]);
      
      setStats(statsData);
      // Dédoublonner par id avant de stocker
      const seen = new Set()
      const uniqueReviews = (reviewsData || []).filter(r => {
        if (!r.id || seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
      setReviews(uniqueReviews);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const maxDist = Math.max(...Object.values(stats.distribution), 1);

  return (
    <View style={styles.container}>
      {/* Header flottant */}
      <Animated.View style={[styles.header, { backgroundColor: `rgba(250, 250, 248, ${headerOpacity})` }]}>
        <View style={styles.headerContent}>
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>🛵</Text>
            </View>
            <Text style={styles.logoText}>DelivTrack</Text>
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Connexion</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        style={{ opacity: fadeAnim }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Disponible à Marrakech</Text>
          </View>
          <Text style={styles.heroTitle}>
            Livraison rapide,{' '}
            <Text style={styles.heroTitleAccent}>suivi en direct.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Café, restaurants, pharmacie, shopping — tout ce dont vous avez besoin, livré chez vous en moins de 30 minutes.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.btnPrimaryText}>Commander maintenant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnSecondaryText}>J'ai déjà un compte</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.features}>
            {[
              { icon: '⚡', label: 'Livraison 30 min' },
              { icon: '📍', label: 'Suivi GPS live' },
              { icon: '💳', label: 'Paiement à la livraison' },
            ].map((item, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
                <Text style={styles.featureLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Section avec les vrais stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total > 0 ? stats.total : '0'}+</Text>
            <Text style={styles.statLabel}>Commandes livrées</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.total > 0 ? Math.round((stats.average / 5) * 100) : 98}%
            </Text>
            <Text style={styles.statLabel}>Clients satisfaits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>25 min</Text>
            <Text style={styles.statLabel}>Délai moyen</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.average > 0 ? stats.average.toFixed(1) : '4.8'}/5</Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.tag}>NOS SERVICES</Text>
            <Text style={styles.sectionTitle}>
              Tout ce que vous aimez,{'\n'}livré à votre porte
            </Text>
            <Text style={styles.sectionSubtitle}>
              4 catégories, des dizaines d'articles, une seule application.
            </Text>
          </View>

          <View style={styles.servicesGrid}>
            {SERVICES.map((service, idx) => (
              <TouchableOpacity key={idx} style={styles.serviceCard} activeOpacity={0.9}>
                <Image source={{ uri: service.img, cache: 'force-cache' }} style={styles.serviceImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.serviceOverlay}
                />
                <View style={styles.serviceText}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDesc}>{service.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How it works Section */}
        <View style={[styles.section, styles.howSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.tag}>COMMENT ÇA MARCHE</Text>
            <Text style={styles.sectionTitle}>4 étapes, c'est tout.</Text>
          </View>

          <View style={styles.stepsContainer}>
            {STEPS.map((step, idx) => (
              <View key={idx} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.n}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.btnPrimaryText}>Essayer gratuitement</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews Section - AVEC VRAIS AVIS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.tag}>AVIS CLIENTS</Text>
            <Text style={styles.sectionTitle}>Ce que disent nos clients</Text>
          </View>

          {/* Widget de note moyenne */}
          <View style={styles.ratingWidget}>
            <View style={styles.ratingWidgetLeft}>
              <Text style={styles.ratingWidgetScore}>
                {stats.average > 0 ? stats.average.toFixed(1) : '4.8'}
              </Text>
              <Stars rating={stats.average || 4.8} size={14} />
              <Text style={styles.ratingWidgetCount}>
                {stats.total > 0 ? `${stats.total} avis vérifiés` : 'Aucun avis'}
              </Text>
            </View>
            <View style={styles.ratingWidgetBars}>
              {[5, 4, 3, 2, 1].map(n => (
                <View key={n} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarLabel}>{n}</Text>
                  <View style={styles.ratingBarBg}>
                    <View style={[styles.ratingBarFill, { width: `${stats.total > 0 ? (stats.distribution[n] / maxDist) * 100 : 0}%` }]} />
                  </View>
                  <Text style={styles.ratingBarCount}>{stats.distribution[n] || 0}</Text>
                </View>
              ))}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1A1A18" style={{ marginTop: 40 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyReviewsTitle}>Aucun avis pour le moment</Text>
              <Text style={styles.emptyReviewsText}>
                Les avis apparaîtront ici après les premières livraisons.
              </Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.btnPrimaryText}>Commander maintenant</Text>
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
                      <Text style={styles.avatarText}>
                        {getInitials(item.clientName)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>
                        {item.clientName || 'Client'}
                      </Text>
                      <Text style={styles.reviewCity}>{item.city || 'Marrakech'}</Text>
                    </View>
                    <Text style={styles.reviewDate}>
                      {timeAgo(item.date || item.createdAt)}
                    </Text>
                  </View>
                  <Stars rating={item.rating || 5} size={14} />
                  <Text style={styles.reviewComment}>
                    "{item.comment || item.ratingComment || 'Service excellent !'}"
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                    <Text style={styles.verifiedText}>Commande vérifiée</Text>
                  </View>
                </View>
              )}
              contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}
            />
          )}
        </View>

        {/* CTA Section */}
        <LinearGradient
          colors={['#1A1A18', '#2A2A28']}
          style={styles.ctaSection}
        >
          <Text style={styles.ctaTitle}>Prêt à commander ?</Text>
          <Text style={styles.ctaSubtitle}>
            Rejoignez des milliers de clients satisfaits à Marrakech. Inscription gratuite, livraison en 30 minutes.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.btnLight} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.btnLightText}>Créer un compte gratuit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnOutlineText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLogo}>
              <View style={styles.footerLogoIcon}>
                <Text>🛵</Text>
              </View>
              <Text style={styles.footerLogoText}>DelivTrack</Text>
            </View>
            <Text style={styles.copyright}>© 2025 DelivTrack</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEBE6',
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 32, height: 32, backgroundColor: '#1A1A18', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  logoIconText: { fontSize: 16 },
  logoText: { fontSize: 18, fontWeight: '800', color: '#1A1A18' },
  loginBtn: { paddingVertical: 9, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5, borderColor: '#D0D0C8' },
  loginBtnText: { fontSize: 14, fontWeight: '500', color: '#1A1A18' },
  hero: { padding: 24, paddingTop: 120 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, alignSelf: 'flex-start', marginBottom: 16, gap: 6 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#1A3A8F' },
  heroTitle: { fontSize: 40, fontWeight: '800', lineHeight: 46, color: '#1A1A18', marginBottom: 16 },
  heroTitleAccent: { color: '#C0392B' },
  heroSubtitle: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 24 },
  heroButtons: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btnPrimary: { backgroundColor: '#1A1A18', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, flex: 1, alignItems: 'center' },
  btnPrimaryText: { color: '#FAFAF8', fontSize: 15, fontWeight: '600' },
  btnSecondary: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 20, borderWidth: 1.5, borderColor: '#D0D0C8', flex: 1, alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '500', color: '#1A1A18' },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureIcon: { fontSize: 14 },
  featureLabel: { fontSize: 13, fontWeight: '500', color: '#555' },
  statsSection: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', backgroundColor: '#1A1A18', paddingVertical: 40, paddingHorizontal: 20, marginVertical: 20 },
  statItem: { alignItems: 'center', minWidth: 80 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#FAFAF8' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 8 },
  section: { padding: 24 },
  sectionHeader: { alignItems: 'center', marginBottom: 32 },
  tag: { backgroundColor: '#F4F4F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: '600', color: '#555', marginBottom: 16 },
  sectionTitle: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#1A1A18', marginBottom: 12 },
  sectionSubtitle: { fontSize: 15, color: '#777', textAlign: 'center' },
  servicesGrid: { gap: 16 },
  serviceCard: { height: 180, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  serviceImage: { width: '100%', height: '100%' },
  serviceOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  serviceText: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  serviceTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  serviceDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  howSection: { backgroundColor: '#F4F4F0', marginVertical: 10 },
  stepsContainer: { gap: 24, marginBottom: 32 },
  stepItem: { alignItems: 'center' },
  stepNumber: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1A18', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stepNumberText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stepTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  stepDesc: { fontSize: 12, color: '#777', textAlign: 'center', paddingHorizontal: 16 },
  ratingWidget: { flexDirection: 'row', backgroundColor: '#F4F4F0', borderRadius: 20, padding: 20, marginBottom: 24, gap: 20 },
  ratingWidgetLeft: { alignItems: 'center', minWidth: 100 },
  ratingWidgetScore: { fontSize: 48, fontWeight: '800', color: '#1A1A18' },
  ratingWidgetCount: { fontSize: 11, color: '#888', marginTop: 6 },
  ratingWidgetBars: { flex: 1, gap: 8 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarLabel: { width: 20, fontSize: 12, color: '#666', fontWeight: '600' },
  ratingBarBg: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  ratingBarCount: { width: 25, fontSize: 11, color: '#888', textAlign: 'right' },
  reviewCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#EBEBE6',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#1A1A18', flex: 1 },
  reviewCity: { fontSize: 11, color: '#999' },
  reviewDate: { fontSize: 10, color: '#CCC' },
  reviewComment: { fontSize: 13, color: '#555', lineHeight: 20, marginVertical: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  verifiedIcon: { fontSize: 12, color: '#22C55E' },
  verifiedText: { fontSize: 11, color: '#999' },
  emptyReviews: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyReviewsTitle: { fontSize: 20, fontWeight: '700', color: '#555', marginBottom: 10 },
  emptyReviewsText: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 24 },
  ctaSection: { padding: 40, alignItems: 'center', marginVertical: 20 },
  ctaTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'center' },
  ctaSubtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  ctaButtons: { gap: 12, width: '100%' },
  btnLight: { backgroundColor: '#FAFAF8', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnLightText: { fontSize: 15, fontWeight: '700', color: '#1A1A18' },
  btnOutline: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  btnOutlineText: { fontSize: 15, fontWeight: '500', color: '#FAFAF8' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#EBEBE6' },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLogoIcon: { width: 26, height: 26, backgroundColor: '#1A1A18', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  footerLogoText: { fontSize: 14, fontWeight: '700' },
  copyright: { fontSize: 12, color: '#999' },
});