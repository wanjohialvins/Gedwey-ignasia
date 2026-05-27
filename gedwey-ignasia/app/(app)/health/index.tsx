import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useHealthCheckins, HealthCheckin } from '../../../lib/queries/health';

// SVG Radar Chart Constants
const WIDTH = 300;
const HEIGHT = 260;
const CX = WIDTH / 2;
const CY = HEIGHT / 2 - 10;
const R = 90;

// Angles in radians for the 5 dimensions: Communication, Intimacy, Trust, Connection, Conflict
const ANGLES = [
  -Math.PI / 2, // Top (Communication)
  -Math.PI / 2 + (2 * Math.PI) / 5, // Top-Right (Intimacy)
  -Math.PI / 2 + (4 * Math.PI) / 5, // Bottom-Right (Trust)
  -Math.PI / 2 + (6 * Math.PI) / 5, // Bottom-Left (Connection)
  -Math.PI / 2 + (8 * Math.PI) / 5, // Top-Left (Conflict)
];

const DIMENSION_KEYS = ['communication', 'intimacy', 'trust', 'connection', 'conflict'] as const;
const DIMENSION_LABELS = ['Comm', 'Intimacy', 'Trust', 'Sync', 'Peace'];

function getPentagonPoints(radius: number): string {
  return ANGLES.map((angle) => {
    const x = CX + radius * Math.cos(angle);
    const y = CY + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
}

function getScorePolygonPoints(checkin: HealthCheckin): string {
  return ANGLES.map((angle, i) => {
    const score = checkin[DIMENSION_KEYS[i]] || 1;
    const radius = R * (score / 10);
    const x = CX + radius * Math.cos(angle);
    const y = CY + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
}

export default function HealthDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  const { data: checkins, isLoading: checkinsLoading } = useHealthCheckins(coupleId);

  const isLoading = profileLoading || checkinsLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading health checks...</Text>
      </View>
    );
  }

  // Find latest checkin for current user and partner
  const myLatest = checkins?.find((c) => c.user_id === user?.id);
  const partnerLatest = checkins?.find((c) => c.user_id !== user?.id);

  const hasMyCheckin = !!myLatest;
  const hasPartnerCheckin = !!partnerLatest;
  const showRadarChart = hasMyCheckin && hasPartnerCheckin;

  const partnerName = profile?.partner_id ? 'Your Partner' : 'Partner';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')}>
            <Text style={styles.backLinkText}>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Relationship Health</Text>
          <Text style={styles.subtitle}>Our weekly emotional alignment check</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {showRadarChart && myLatest && partnerLatest ? (
            /* Radar Comparison View */
            <View style={styles.radarSection}>
              <View style={styles.radarCard}>
                <Svg width={WIDTH} height={HEIGHT}>
                  {/* Concentric pentagonal grid lines (levels 2, 4, 6, 8, 10) */}
                  {[2, 4, 6, 8, 10].map((level) => {
                    const levelRadius = R * (level / 10);
                    return (
                      <Polygon
                        key={level}
                        points={getPentagonPoints(levelRadius)}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Axes lines from center to outer points */}
                  {ANGLES.map((angle, i) => {
                    const x2 = CX + R * Math.cos(angle);
                    const y2 = CY + R * Math.sin(angle);
                    
                    // Offset text placement slightly outside the outermost pentagon
                    const textDist = R + 18;
                    const tx = CX + textDist * Math.cos(angle);
                    const ty = CY + textDist * Math.sin(angle) + 4; // micro adjustments

                    return (
                      <React.Fragment key={i}>
                        <Line x1={CX} y1={CY} x2={x2} y2={y2} stroke="#E2E8F0" strokeWidth="1" />
                        <SvgText
                          x={tx}
                          y={ty}
                          fill="#475569"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {DIMENSION_LABELS[i]}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* Partner Scores Polygon (Pink/Purple) */}
                  <Polygon
                    points={getScorePolygonPoints(partnerLatest)}
                    fill="rgba(212, 83, 126, 0.15)"
                    stroke="#D4537E"
                    strokeWidth="2"
                  />

                  {/* My Scores Polygon (Blue) */}
                  <Polygon
                    points={getScorePolygonPoints(myLatest)}
                    fill="rgba(37, 99, 235, 0.15)"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                </Svg>

                {/* Legend Row */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                    <Text style={styles.legendText}>You</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#D4537E' }]} />
                    <Text style={styles.legendText}>{partnerName}</Text>
                  </View>
                </View>
              </View>

              {/* Dimension Details Table */}
              <View style={styles.comparisonList}>
                <Text style={styles.comparisonTitle}>Dimension Breakdown</Text>
                {DIMENSION_KEYS.map((key, i) => {
                  const myVal = myLatest[key] || 0;
                  const partnerVal = partnerLatest[key] || 0;
                  const diff = Math.abs(myVal - partnerVal);

                  return (
                    <View key={key} style={styles.comparisonRow}>
                      <View style={styles.comparisonMeta}>
                        <Text style={styles.dimensionName}>
                          {DIMENSION_LABELS[i]}
                        </Text>
                        <Text style={styles.comparisonText}>
                          You: <Text style={styles.myValText}>{myVal}</Text> • {partnerName}:{' '}
                          <Text style={styles.partnerValText}>{partnerVal}</Text>
                        </Text>
                      </View>
                      
                      {/* Alignment badge */}
                      <View
                        style={[
                          styles.alignmentBadge,
                          diff <= 1 ? styles.badgeAlign : styles.badgeGap,
                        ]}
                      >
                        <Text
                          style={[
                            styles.alignmentBadgeText,
                            diff <= 1 ? styles.textAlign : styles.textGap,
                          ]}
                        >
                          {diff <= 1 ? '✨ In-sync' : '💬 Talk'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Action Button to complete another week check-in */}
              <TouchableOpacity
                style={styles.primaryButtonOutlined}
                onPress={() => router.push('/health/checkin')}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonTextOutlined}>New Weekly Assessment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Single check-in / empty states */
            <View style={styles.emptyStateContainer}>
              <Text style={styles.bigHeartEmoji}>❤️</Text>

              {hasMyCheckin && !hasPartnerCheckin ? (
                /* I completed, waiting for partner */
                <View style={styles.waitingContent}>
                  <Text style={styles.waitingTitle}>Waiting for {partnerName}...</Text>
                  <Text style={styles.waitingSubtitle}>
                    You completed your weekly assessment! Once your partner completes theirs, your relationship alignment radar will be revealed.
                  </Text>

                  {/* My Scores Summary preview list */}
                  <View style={styles.myRatingsSummary}>
                    <Text style={styles.ratingsSummaryTitle}>Your Ratings Summary</Text>
                    {DIMENSION_KEYS.map((key, i) => {
                      const score = myLatest[key] || 0;
                      return (
                        <View key={key} style={styles.summaryBarRow}>
                          <Text style={styles.summaryBarLabel}>{DIMENSION_LABELS[i]}</Text>
                          <View style={styles.barOuter}>
                            <View style={[styles.barInner, { width: `${score * 10}%` }]} />
                          </View>
                          <Text style={styles.summaryBarScore}>{score}/10</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : !hasMyCheckin && hasPartnerCheckin ? (
                /* Partner completed, waiting for me */
                <View style={styles.waitingContent}>
                  <Text style={styles.waitingTitle}>{partnerName} is Waiting!</Text>
                  <Text style={styles.waitingSubtitle}>
                    Your partner has completed their weekly relationship health check-in. Complete yours now to unlock the comparison chart!
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/health/checkin')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Start My Assessment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Neither completed check-ins */
                <View style={styles.waitingContent}>
                  <Text style={styles.waitingTitle}>Assess Our Alignment</Text>
                  <Text style={styles.waitingSubtitle}>
                    Take a 5-dimension relationship assessment weekly to track your communication, trust, intimacy, sync, and peace over time.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/health/checkin')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Complete My Assessment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 16,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 6,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  radarSection: {
    gap: 16,
  },
  radarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  comparisonList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  comparisonMeta: {
    flex: 1,
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  comparisonText: {
    fontSize: 12,
    color: '#64748B',
  },
  myValText: {
    fontWeight: '600',
    color: '#2563EB',
  },
  partnerValText: {
    fontWeight: '600',
    color: '#D4537E',
  },
  alignmentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAlign: {
    backgroundColor: '#F0FDF4',
  },
  badgeGap: {
    backgroundColor: '#FFFBEB',
  },
  alignmentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textAlign: {
    color: '#16A34A',
  },
  textGap: {
    color: '#D97706',
  },
  primaryButtonOutlined: {
    backgroundColor: '#EFF6FF',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8,
  },
  buttonTextOutlined: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  bigHeartEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  waitingContent: {
    alignItems: 'center',
    width: '100%',
  },
  waitingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  myRatingsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingsSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  summaryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    width: 60,
  },
  barOuter: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barInner: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  summaryBarScore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    width: 40,
    textAlign: 'right',
  },
});
