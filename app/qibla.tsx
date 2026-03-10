import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated, Easing } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Kaaba coordinates (Makkah al-Mukarramah)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(d: number) { return d * (Math.PI / 180); }
function toDeg(r: number) { return r * (180 / Math.PI); }

/** Great-circle bearing from (lat,lng) to Kaaba */
function calcQiblaBearing(lat: number, lng: number): number {
    const dL = toRad(KAABA_LNG - lng);
    const y = Math.sin(dL) * Math.cos(toRad(KAABA_LAT));
    const x = Math.cos(toRad(lat)) * Math.sin(toRad(KAABA_LAT))
        - Math.sin(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.cos(dL);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export default function QiblaScreen() {
    const insets = useSafeAreaInsets();

    // heading = degrees-from-north the TOP of the phone is facing (0–360)
    const [heading, setHeading] = useState(0);
    const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
    const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

    // Animated values (store accumulated angle to avoid 0↔360 jumps)
    const roseAnim = useRef(new Animated.Value(0)).current;
    const needleAnim = useRef(new Animated.Value(0)).current;
    const prevRose = useRef(0);
    const prevNeedle = useRef(0);

    /* ───── Location → Qibla bearing (once) ───── */
    useEffect(() => {
        (async () => {
            const { status: s } = await Location.requestForegroundPermissionsAsync();
            if (s !== 'granted') { setStatus('denied'); return; }
            const loc = await Location.getCurrentPositionAsync({});
            setQiblaBearing(calcQiblaBearing(loc.coords.latitude, loc.coords.longitude));
            setStatus('ok');
        })();
    }, []);

    /* ───── Device heading via expo-location (calibrated) ───── */
    useEffect(() => {
        let sub: Location.LocationSubscription | null = null;
        (async () => {
            sub = await Location.watchHeadingAsync((h) => {
                // trueHeading is available on iOS; fall back to magHeading on Android
                const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
                setHeading(deg);
            });
        })();
        return () => { sub?.remove(); };
    }, []);

    /* ───── Animate compass rose (rotates opposite to device heading) ───── */
    useEffect(() => {
        let d = -heading - prevRose.current;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        const next = prevRose.current + d;
        prevRose.current = next;
        Animated.timing(roseAnim, { toValue: next, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }, [heading]);

    /* ───── Animate Qibla needle ───── */
    useEffect(() => {
        if (qiblaBearing === null) return;
        // needle angle in screen space = absolute bearing − current heading
        let d = (qiblaBearing - heading) - prevNeedle.current;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        const next = prevNeedle.current + d;
        prevNeedle.current = next;
        Animated.timing(needleAnim, { toValue: next, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }, [heading, qiblaBearing]);

    const roseRotate = roseAnim.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
    const needleRotate = needleAnim.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

    const diff = qiblaBearing !== null ? Math.abs(((qiblaBearing - heading) + 360) % 360) : 180;
    const onQibla = diff < 8 || diff > 352;

    /* ───── Compass rose geometry ───── */
    const R = 128; // ring radius
    const CARDINALS = [
        { label: 'U', deg: 0, color: '#f43f5e' },
        { label: 'T', deg: 90, color: '#94a3b8' },
        { label: 'S', deg: 180, color: '#94a3b8' },
        { label: 'B', deg: 270, color: '#94a3b8' },
    ];
    const TICKS = Array.from({ length: 36 }, (_, i) => i * 10); // tick every 10°

    return (
        <View style={s.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[s.header, { paddingTop: insets.top + 16 }]}>
                <Pressable onPress={() => router.back()} style={s.back}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>Arah Kiblat</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={s.body}>

                {/* ─── Compass ─── */}
                <View style={[s.ringOuter, onQibla && s.ringOuterActive]}>

                    {/* Fixed "U" reference on outer ring */}
                    <Text style={s.fixedNorth}>U</Text>

                    {/* Rotating rose: ticks + cardinal labels */}
                    <Animated.View style={[s.layer, { transform: [{ rotate: roseRotate }] }]}>
                        {TICKS.map(deg => {
                            const rad = toRad(deg - 90);
                            const isMajor = deg % 90 === 0;
                            return (
                                <View key={deg} style={[s.tick, {
                                    width: isMajor ? 3 : 1,
                                    height: isMajor ? 14 : 8,
                                    backgroundColor: isMajor ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
                                    transform: [
                                        { translateX: R * Math.cos(rad) },
                                        { translateY: R * Math.sin(rad) },
                                        { rotate: `${deg}deg` },
                                    ],
                                }]} />
                            );
                        })}
                        {CARDINALS.map(({ label, deg, color }) => {
                            const rad = toRad(deg - 90);
                            return (
                                <Text key={label} style={[s.cardinal, {
                                    color, transform: [
                                        { translateX: (R - 24) * Math.cos(rad) },
                                        { translateY: (R - 24) * Math.sin(rad) },
                                    ]
                                }]}>{label}</Text>
                            );
                        })}
                    </Animated.View>

                    {/* Qibla needle — separate animated layer */}
                    {qiblaBearing !== null && (
                        <Animated.View style={[s.layer, { transform: [{ rotate: needleRotate }] }]}>
                            {/* Tip → Kaaba */}
                            <View style={s.needleTip} />
                            {/* Tail */}
                            <View style={s.needleTail} />
                            {/* Center pin */}
                            <View style={s.pin} />
                        </Animated.View>
                    )}

                    {/* Kaaba emoji centered */}
                    <Text style={s.kaaba} pointerEvents="none">🕋</Text>
                </View>

                {/* ─── Status pill ─── */}
                {status === 'loading' && (
                    <View style={s.pill}>
                        <Ionicons name="location-outline" size={20} color="#94a3b8" />
                        <Text style={s.pillText}>Mendeteksi lokasi GPS…</Text>
                    </View>
                )}
                {status === 'denied' && (
                    <View style={[s.pill, { borderColor: '#ef4444' }]}>
                        <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                        <Text style={[s.pillText, { color: '#ef4444' }]}>Izin lokasi ditolak</Text>
                    </View>
                )}
                {status === 'ok' && (onQibla ? (
                    <LinearGradient colors={['#10b981', '#059669']} style={s.pillActive}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={[s.pillText, { color: '#fff' }]}>Menghadap Kiblat ✓</Text>
                    </LinearGradient>
                ) : (
                    <View style={[s.pill, { borderColor: '#10b981' }]}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' }} />
                        <Text style={s.pillText}>Arahkan jarum hijau ke atas</Text>
                    </View>
                ))}

                <Text style={s.hint}>Letakkan HP mendatar untuk akurasi optimal. Jauhkan dari benda logam/magnet.</Text>
            </View>
        </View>
    );
}

const D = 290; // outer ring diameter

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
    back: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: '#fff' },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },

    ringOuter: {
        width: D, height: D, borderRadius: D / 2,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 44,
    },
    ringOuterActive: { borderColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 20, elevation: 8 },

    fixedNorth: { position: 'absolute', top: 10, color: '#f43f5e', fontSize: 14, fontWeight: '900' },

    layer: { position: 'absolute', width: D, height: D, alignItems: 'center', justifyContent: 'center' },

    tick: { position: 'absolute', borderRadius: 1 },
    cardinal: { position: 'absolute', fontSize: 13, fontWeight: '800', textAlign: 'center' },

    needleTip: {
        position: 'absolute', bottom: '50%', marginBottom: 4,
        width: 0, height: 0,
        borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 70,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: '#10b981',
    },
    needleTail: {
        position: 'absolute', top: '50%', marginTop: 4,
        width: 0, height: 0,
        borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 60,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: 'rgba(100,116,139,0.5)',
    },
    pin: {
        position: 'absolute',
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#fff',
        borderWidth: 2, borderColor: '#0f172a',
    },
    kaaba: { position: 'absolute', fontSize: 18 },

    pill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    pillActive: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100 },
    pillText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },

    hint: { marginTop: 20, fontSize: 12, color: '#334155', textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 },
});
