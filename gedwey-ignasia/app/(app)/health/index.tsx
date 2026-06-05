import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Polygon, Line, Text as SvgText, Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useHealthCheckins, HealthCheckin } from '../../../lib/queries/health';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { ScreenShell } from '../../../components/ScreenShell';

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
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4">
            <Skeleton width={80} height={20} className="mt-2.5 mb-2 py-1" />
            <View className="mb-4">
              <Skeleton width={180} height={28} className="mb-2" />
              <Skeleton width={140} height={16} />
            </View>

            {/* Radar Chart Card Skeleton */}
            <Card className="p-5 mb-5 items-center justify-center h-[260px]">
              <Skeleton width={180} height={180} variant="circle" />
              <View className="flex-row gap-4 mt-4">
                <Skeleton width={60} height={14} />
                <Skeleton width={60} height={14} />
              </View>
            </Card>

            {/* Breakdown Skeleton */}
            <Card className="p-5 mb-5">
              <Skeleton width={150} height={20} className="mb-4" />
              {[1, 2, 3].map((i) => (
                <View key={i} className="flex-row justify-between py-3 border-b border-slate-100 items-center">
                  <View className="gap-1.5 flex-1">
                    <Skeleton width={80} height={14} className="mb-1" />
                    <Skeleton width={120} height={10} />
                  </View>
                  <Skeleton width={70} height={20} className="rounded-lg" />
                </View>
              ))}
            </Card>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  // Find latest checkin for current user and partner
  const myLatest = checkins?.find((c) => c.user_id === user?.id);
  const partnerLatest = checkins?.find((c) => c.user_id !== user?.id);

  const hasMyCheckin = !!myLatest;
  const hasPartnerCheckin = !!partnerLatest;
  const showRadarChart = hasMyCheckin && hasPartnerCheckin;

  const partnerName = profile?.partner_id ? 'Your Partner' : 'Partner';

  // 1. Calculate historical trend lines
  const myHistory = checkins
    ? [...checkins]
        .filter((c) => c.user_id === user?.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];
  const partnerHistory = checkins
    ? [...checkins]
        .filter((c) => c.user_id !== user?.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const getPoints = (historyList: HealthCheckin[]) => {
    const list = historyList.slice(-5); // Plot the last 5 weeks
    if (list.length === 0) return [];
    
    const spacing = list.length > 1 ? 240 / (list.length - 1) : 240;
    return list.map((c, idx) => {
      const avg =
        (c.communication + c.intimacy + c.trust + c.connection + c.conflict) / 5;
      const x = 30 + idx * spacing;
      // Map Y coordinates: Y increases downwards in SVG
      const y = 120 - (avg / 10) * 90 - 10;
      return { x, y, score: avg };
    });
  };

  const myPoints = getPoints(myHistory);
  const partnerPoints = getPoints(partnerHistory);

  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          {/* Header */}
          <View className="pt-2.5 mb-5">
            <TouchableOpacity className="self-start py-1 mb-1.5" onPress={() => router.replace('/')}>
              <Text className="text-primary-600 text-sm font-semibold">← Dashboard</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-text-primary">Relationship Health</Text>
            <Text className="text-sm text-text-secondary mt-0.5">Our weekly emotional alignment check</Text>
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {showRadarChart && myLatest && partnerLatest ? (
              /* Radar Comparison View */
              <View className="gap-4">
                <Card className="p-4 items-center">
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
                  <View className="flex-row gap-4 mt-2.5">
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-primary-600" />
                      <Text className="text-xs font-semibold text-text-secondary">You</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-[#D4537E]" />
                      <Text className="text-xs font-semibold text-text-secondary">{partnerName}</Text>
                    </View>
                  </View>
                </Card>

                {/* Premium SVG cubic Bezier Weekly Trends Chart */}
                {checkins && checkins.length >= 2 && (
                  <Card className="p-5 mb-1.5 items-center">
                    <Text className="text-base font-bold text-text-primary mb-1.5 self-start">Weekly Alignment Trends</Text>
                    <Text className="text-xs text-text-secondary mb-4 self-start leading-normal">
                      Comparing your overall relationship sync scores weekly side-by-side.
                    </Text>
                    
                    <Svg width={300} height={140}>
                      {/* Grid lines */}
                      {[2, 4, 6, 8, 10].map((level) => {
                        const y = 120 - (level / 10) * 90 - 10;
                        return (
                          <React.Fragment key={level}>
                            <Line x1={25} y1={y} x2={280} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            <SvgText x={5} y={y + 3} fill="#94A3B8" fontSize="8">{level}</SvgText>
                          </React.Fragment>
                        );
                      })}

                      {/* Plots */}
                      {partnerPoints.length > 1 && (
                        <Path
                          d={getBezierPath(partnerPoints)}
                          fill="none"
                          stroke="#D4537E"
                          strokeWidth="3"
                        />
                      )}
                      {myPoints.length > 1 && (
                        <Path
                          d={getBezierPath(myPoints)}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="3.5"
                        />
                      )}

                      {/* Circles on dots */}
                      {partnerPoints.map((pt, i) => (
                        <Circle key={`partner-${i}`} cx={pt.x} cy={pt.y} r={4.5} fill="#D4537E" stroke="#FFFFFF" strokeWidth="1.5" />
                      ))}
                      {myPoints.map((pt, i) => (
                        <Circle key={`my-${i}`} cx={pt.x} cy={pt.y} r={5} fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      ))}
                    </Svg>
                    
                    {/* Legend Row */}
                    <View className="flex-row gap-4 mt-3">
                      <View className="flex-row items-center">
                        <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-primary-600" />
                        <Text className="text-2xs font-semibold text-text-secondary">You (Avg: {myPoints.length > 0 ? (myPoints.reduce((s, p) => s + p.score, 0) / myPoints.length).toFixed(1) : 0})</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-[#D4537E]" />
                        <Text className="text-2xs font-semibold text-text-secondary">{partnerName} (Avg: {partnerPoints.length > 0 ? (partnerPoints.reduce((s, p) => s + p.score, 0) / partnerPoints.length).toFixed(1) : 0})</Text>
                      </View>
                    </View>
                  </Card>
                )}

                {/* Dimension Details Table */}
                <Card className="p-4 gap-3">
                  <Text className="text-base font-bold text-text-primary mb-1">Dimension Breakdown</Text>
                  {DIMENSION_KEYS.map((key, i) => {
                    const myVal = myLatest[key] || 0;
                    const partnerVal = partnerLatest[key] || 0;
                    const diff = Math.abs(myVal - partnerVal);

                    return (
                      <View key={key} className="flex-row justify-between items-center py-2.5 border-b border-slate-100 last:border-b-0">
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-slate-700 mb-0.5">
                            {DIMENSION_LABELS[i]}
                          </Text>
                          <Text className="text-xs text-text-muted">
                            You: <Text className="font-semibold text-primary-600">{myVal}</Text> • {partnerName}:{' '}
                            <Text className="font-semibold text-[#D4537E]">{partnerVal}</Text>
                          </Text>
                        </View>
                        
                        {/* Alignment badge */}
                        <View
                          className={`px-2.5 py-1 rounded-full ${
                            diff <= 1 ? 'bg-emerald-50' : 'bg-amber-50'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              diff <= 1 ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {diff <= 1 ? '✨ In-sync' : '💬 Talk'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>

                {/* Action Button to complete another week check-in */}
                <Button
                  title="New Weekly Assessment"
                  onPress={() => router.push('/health/checkin')}
                  variant="secondary"
                  className="w-full mt-2"
                />
              </View>
            ) : (
              /* Single check-in / empty states */
              <View className="flex-1 justify-center items-center pt-8 pb-10 px-4">
                <Text className="text-5xl mb-4">❤️</Text>

                {hasMyCheckin && !hasPartnerCheckin ? (
                  /* I completed, waiting for partner */
                  <View className="items-center w-full">
                    <Text className="text-xl font-bold text-text-primary text-center mb-2">Waiting for {partnerName}...</Text>
                    <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
                      You completed your weekly assessment! Once your partner completes theirs, your relationship alignment radar will be revealed.
                    </Text>

                    {/* My Scores Summary preview list */}
                    <Card className="p-4 w-full gap-3">
                      <Text className="text-sm font-bold text-slate-700 mb-1">Your Ratings Summary</Text>
                      {DIMENSION_KEYS.map((key, i) => {
                        const score = myLatest[key] || 0;
                        return (
                          <View key={key} className="flex-row items-center justify-between gap-2">
                            <Text className="text-[10px] font-semibold text-text-muted w-14">{DIMENSION_LABELS[i]}</Text>
                            <View className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <View style={{ width: `${score * 10}%` }} className="h-full bg-primary-600 rounded-full" />
                            </View>
                            <Text className="text-[10px] font-bold text-slate-700 w-10 text-right">{score}/10</Text>
                          </View>
                        );
                      })}
                    </Card>
                  </				View>
                ) : !hasMyCheckin && hasPartnerCheckin ? (
                  /* Partner completed, waiting for me */
                  <View className="items-center w-full">
                    <Text className="text-xl font-bold text-text-primary text-center mb-2">{partnerName} is Waiting!</Text>
                    <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
                      Your partner has completed their weekly relationship health check-in. Complete yours now to unlock the comparison chart!
                    </Text>
                    <Button
                      title="Start My Assessment"
                      onPress={() => router.push('/health/checkin')}
                      className="w-full"
                    />
                  </View>
                ) : (
                  /* Neither completed check-ins */
                  <View className="items-center w-full">
                    <Text className="text-xl font-bold text-text-primary text-center mb-2">Assess Our Alignment</Text>
                    <Text className="text-sm text-text-secondary text-center leading-relaxed mb-6 px-4">
                      Take a 5-dimension relationship assessment weekly to track your communication, trust, intimacy, sync, and peace over time.
                    </Text>
                    <Button
                      title="Complete My Assessment"
                      onPress={() => router.push('/health/checkin')}
                      className="w-full"
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}
